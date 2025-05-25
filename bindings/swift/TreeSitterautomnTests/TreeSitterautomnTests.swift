import XCTest
import SwiftTreeSitter
import TreeSitterAutomn

final class TreeSitterAutomnTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_automn())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading automn grammar")
    }
}
