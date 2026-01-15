package services

import (
    "archive/zip"
    "bytes"
    "encoding/xml"
    "fmt"
    "io"
    "path/filepath"
    "regexp"
    "strings"

    "github.com/ledongthuc/pdf"
    "github.com/xuri/excelize/v2"
)

type ParserService struct{}

func NewParserService() *ParserService {
    return &ParserService{}
}

func (p *ParserService) ParseDocument(data []byte, fileName string) (text string, keywords []string, errors []string, err error) {
    ext := strings.ToLower(filepath.Ext(fileName))

    switch ext {
    case ".pdf":
        text, err = p.parsePDF(data)
    case ".docx":
        text, err = p.parseDOCX(data)
    case ".xlsx":
        text, err = p.parseXLSX(data)
    case ".csv":
        text = string(data)
    case ".txt":
        text = string(data)
    default:
        err = fmt.Errorf("unsupported file type: %s", ext)
    }

    if err != nil {
        return "", nil, nil, err
    }

    // Extract keywords (simple word frequency)
    keywords = p.extractKeywords(text)

    // Extract error messages
    errors = p.extractErrorMessages(text)

    return text, keywords, errors, nil
}

func (p *ParserService) parsePDF(data []byte) (string, error) {
    reader := bytes.NewReader(data)
    pdfReader, err := pdf.NewReader(reader, int64(len(data)))
    if err != nil {
        return "", fmt.Errorf("failed to read PDF: %v", err)
    }

    var text strings.Builder
    numPages := pdfReader.NumPage()

    for i := 1; i <= numPages; i++ {
        page := pdfReader.Page(i)
        if page.V.IsNull() {
            continue
        }

        pageText, err := page.GetPlainText(nil)
        if err != nil {
            continue
        }
        text.WriteString(pageText)
        text.WriteString("\n")
    }

    return text.String(), nil
}

// FIXED: Parse DOCX using xml extraction
func (p *ParserService) parseDOCX(data []byte) (string, error) {
    reader := bytes.NewReader(data)
    zipReader, err := zip.NewReader(reader, int64(len(data)))
    if err != nil {
        return "", fmt.Errorf("failed to read DOCX as zip: %v", err)
    }

    // Find document.xml
    var documentXML *zip.File
    for _, file := range zipReader.File {
        if file.Name == "word/document.xml" {
            documentXML = file
            break
        }
    }

    if documentXML == nil {
        return "", fmt.Errorf("document.xml not found in DOCX")
    }

    // Read document.xml
    rc, err := documentXML.Open()
    if err != nil {
        return "", fmt.Errorf("failed to open document.xml: %v", err)
    }
    defer rc.Close()

    xmlData, err := io.ReadAll(rc)
    if err != nil {
        return "", fmt.Errorf("failed to read document.xml: %v", err)
    }

    // Parse XML to extract text
    type Text struct {
        Value string `xml:",chardata"`
    }
    type Run struct {
        Text []Text `xml:"t"`
    }
    type Paragraph struct {
        Runs []Run `xml:"r"`
    }
    type Body struct {
        Paragraphs []Paragraph `xml:"p"`
    }
    type Document struct {
        Body Body `xml:"body"`
    }

    var doc Document
    if err := xml.Unmarshal(xmlData, &doc); err != nil {
        return "", fmt.Errorf("failed to parse XML: %v", err)
    }

    // Extract text
    var text strings.Builder
    for _, para := range doc.Body.Paragraphs {
        for _, run := range para.Runs {
            for _, t := range run.Text {
                text.WriteString(t.Value)
            }
        }
        text.WriteString("\n")
    }

    return text.String(), nil
}

func (p *ParserService) parseXLSX(data []byte) (string, error) {
    reader := bytes.NewReader(data)
    f, err := excelize.OpenReader(reader)
    if err != nil {
        return "", fmt.Errorf("failed to read XLSX: %v", err)
    }
    defer f.Close()

    var text strings.Builder
    
    for _, sheetName := range f.GetSheetList() {
        rows, err := f.GetRows(sheetName)
        if err != nil {
            continue
        }

        text.WriteString(fmt.Sprintf("Sheet: %s\n", sheetName))
        for _, row := range rows {
            text.WriteString(strings.Join(row, "\t"))
            text.WriteString("\n")
        }
        text.WriteString("\n")
    }

    return text.String(), nil
}

func (p *ParserService) extractKeywords(text string) []string {
    // Simple keyword extraction: words that appear frequently
    words := strings.Fields(strings.ToLower(text))
    wordCount := make(map[string]int)

    for _, word := range words {
        // Remove punctuation
        word = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(word, "")
        if len(word) > 3 { // Only words longer than 3 chars
            wordCount[word]++
        }
    }

    // Get top keywords
    var keywords []string
    for word, count := range wordCount {
        if count >= 3 { // Appears at least 3 times
            keywords = append(keywords, word)
        }
    }

    // Limit to top 20
    if len(keywords) > 20 {
        keywords = keywords[:20]
    }

    return keywords
}

func (p *ParserService) extractErrorMessages(text string) []string {
    // Look for common error patterns
    patterns := []string{
        `(?i)error[:\s]+(.{10,100})`,
        `(?i)exception[:\s]+(.{10,100})`,
        `(?i)failed[:\s]+(.{10,100})`,
        `(?i)critical[:\s]+(.{10,100})`,
        `(?i)warning[:\s]+(.{10,100})`,
    }

    var errors []string
    seen := make(map[string]bool)

    for _, pattern := range patterns {
        re := regexp.MustCompile(pattern)
        matches := re.FindAllStringSubmatch(text, -1)
        
        for _, match := range matches {
            if len(match) > 1 {
                errorMsg := strings.TrimSpace(match[1])
                if !seen[errorMsg] && len(errorMsg) > 10 {
                    errors = append(errors, errorMsg)
                    seen[errorMsg] = true
                }
            }
        }
    }

    // Limit to top 10
    if len(errors) > 10 {
        errors = errors[:10]
    }

    return errors
}
