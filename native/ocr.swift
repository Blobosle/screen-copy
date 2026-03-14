import CoreGraphics
import Foundation
import ImageIO
import Vision

struct OCRToken {
    let text: String
    let minX: CGFloat
    let midY: CGFloat
    let height: CGFloat
}

struct OCRLine {
    var tokens: [OCRToken]
    var midY: CGFloat
    var averageHeight: CGFloat

    mutating func add(_ token: OCRToken) {
        tokens.append(token)
        let count = CGFloat(tokens.count)
        midY = ((midY * (count - 1.0)) + token.midY) / count
        averageHeight = ((averageHeight * (count - 1.0)) + token.height) / count
    }
}

enum OCRHelperError: LocalizedError {
    case missingImagePath
    case unreadableImage

    var errorDescription: String? {
        switch self {
        case .missingImagePath:
            return "Missing image path argument."
        case .unreadableImage:
            return "Could not load the screenshot image."
        }
    }
}

func loadCGImage(from url: URL) throws -> CGImage {
    guard
        let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else {
        throw OCRHelperError.unreadableImage
    }

    return image
}

func recognizeQRCodePayloads(from image: CGImage) throws -> String {
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    try handler.perform([request])

    let payloads = (request.results ?? [])
        .compactMap { observation in
            observation.payloadStringValue?.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        .filter { !$0.isEmpty }

    if payloads.isEmpty {
        return ""
    }

    let uniquePayloads = Array(NSOrderedSet(array: payloads)) as? [String] ?? payloads
    return uniquePayloads.joined(separator: "\n")
}

func recognizeText(from image: CGImage) throws -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    try handler.perform([request])

    let observations = request.results ?? []

    let tokens = observations.compactMap { observation -> OCRToken? in
        guard let candidate = observation.topCandidates(1).first else {
            return nil
        }

        let box = observation.boundingBox
        return OCRToken(
            text: candidate.string,
            minX: box.minX,
            midY: box.midY,
            height: box.height
        )
    }
    .sorted { lhs, rhs in
        let verticalDelta = abs(lhs.midY - rhs.midY)
        if verticalDelta > 0.015 {
            return lhs.midY > rhs.midY
        }

        return lhs.minX < rhs.minX
    }

    var lines: [OCRLine] = []

    for token in tokens {
        if var last = lines.last {
            let tolerance = max(last.averageHeight, token.height) * 0.65
            if abs(last.midY - token.midY) <= tolerance {
                last.add(token)
                lines[lines.count - 1] = last
                continue
            }
        }

        lines.append(OCRLine(tokens: [token], midY: token.midY, averageHeight: token.height))
    }

    return lines
        .map { line in
            line.tokens
                .sorted { $0.minX < $1.minX }
                .map(\.text)
                .joined(separator: " ")
        }
        .joined(separator: "\n")
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

func recognizeContent(from image: CGImage) throws -> String {
    let qrPayloads = try recognizeQRCodePayloads(from: image)
    if !qrPayloads.isEmpty {
        return qrPayloads
    }

    return try recognizeText(from: image)
}

do {
    guard CommandLine.arguments.count >= 2 else {
        throw OCRHelperError.missingImagePath
    }

    let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
    let image = try loadCGImage(from: imageURL)
    let content = try recognizeContent(from: image)
    FileHandle.standardOutput.write(Data(content.utf8))
} catch {
    let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}
