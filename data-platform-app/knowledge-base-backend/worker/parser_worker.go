package worker

import (
    "context"
    "fmt"
    "log"
    "time"

    "knowledge-base-backend/models"
    "knowledge-base-backend/services"
)

type ParseJob struct {
    Document *models.Document
}

type ParserWorker struct {
    jobQueue       chan ParseJob
    gcsService     *services.GCSService
    couchbaseService *services.CouchbaseService
    parserService  *services.ParserService
}

func NewParserWorker(
    channelSize int,
    gcsService *services.GCSService,
    couchbaseService *services.CouchbaseService,
) *ParserWorker {
    return &ParserWorker{
        jobQueue:         make(chan ParseJob, channelSize),
        gcsService:       gcsService,
        couchbaseService: couchbaseService,
        parserService:    services.NewParserService(),
    }
}

func (w *ParserWorker) Start(numWorkers int) {
    log.Printf("Starting %d parser workers...", numWorkers)
    
    for i := 0; i < numWorkers; i++ {
        go w.processJobs(i)
    }
}

func (w *ParserWorker) AddJob(doc *models.Document) {
    w.jobQueue <- ParseJob{Document: doc}
}

func (w *ParserWorker) processJobs(workerID int) {
    for job := range w.jobQueue {
        log.Printf("Worker %d: Processing document %s", workerID, job.Document.ID)
        
        err := w.processDocument(job.Document)
        if err != nil {
            log.Printf("Worker %d: Error processing %s: %v", workerID, job.Document.ID, err)
        } else {
            log.Printf("Worker %d: Successfully processed %s", workerID, job.Document.ID)
        }
    }
}

func (w *ParserWorker) processDocument(doc *models.Document) error {
    ctx := context.Background()

    // Update status to parsing
    doc.Status = "parsing"
    doc.UpdatedAt = time.Now()
    if err := w.couchbaseService.SaveDocument(doc); err != nil {
        return fmt.Errorf("failed to update status: %v", err)
    }

    // Download file from GCS
    fileData, err := w.gcsService.DownloadFile(ctx, doc.GCSPath)
    if err != nil {
        doc.Status = "error"
        doc.UpdatedAt = time.Now()
        w.couchbaseService.SaveDocument(doc)
        return fmt.Errorf("failed to download file: %v", err)
    }

    // Parse document
    parsedText, keywords, errors, err := w.parserService.ParseDocument(fileData, doc.FileName)
    if err != nil {
        doc.Status = "error"
        doc.UpdatedAt = time.Now()
        w.couchbaseService.SaveDocument(doc)
        return fmt.Errorf("failed to parse document: %v", err)
    }

    // Update document with parsed data
    now := time.Now()
    doc.ParsedText = parsedText
    doc.Keywords = keywords
    doc.ErrorMessages = errors
    doc.Status = "parsed"
    doc.ParsedAt = &now
    doc.UpdatedAt = now

    // Save to Couchbase
    if err := w.couchbaseService.SaveDocument(doc); err != nil {
        return fmt.Errorf("failed to save parsed document: %v", err)
    }

    return nil
}
