#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

enum TokenType {
    INDENT,
    DEDENT,
    NEWLINE,
    END,
};

typedef struct {
    Array(uint16_t) indents;
    bool final_newlined;
    uint16_t dedents;
} Scanner;

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

bool tree_sitter_automn_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;

    bool found_end_of_line = false;
    uint16_t indent_length = 0;



    if(scanner->dedents == 1 && valid_symbols[NEWLINE]) {
        lexer->result_symbol = NEWLINE;
        scanner->dedents = 0;
        return true;
    } else if (scanner->dedents > 1 && valid_symbols[DEDENT]) {
        scanner->dedents -= 1;
        lexer->result_symbol = DEDENT;
        return true;
    } else {
        scanner->dedents = 0;
    }
    // if(lexer->eof(lexer)) {
    //     lexer->result_symbol = END;
    //     lexer->mark_end(lexer);
    //     return true;
    // }

    for (;;) {
        if(lexer->eof(lexer)) {
            break;
        }
        if (lexer->lookahead == '\n') {
            found_end_of_line = true;
            indent_length = 0;
            skip(lexer);
        } else if (lexer->lookahead == ' ') {
            indent_length++;
            skip(lexer);
        } else if (lexer->lookahead == '\r' || lexer->lookahead == '\f') {
            indent_length = 0;
            skip(lexer);
        } else if (lexer->lookahead == '\t') {
            indent_length += 4;
            skip(lexer);
        } else if (lexer->lookahead == '\\') {
            skip(lexer);
            if (lexer->lookahead == '\r') {
                skip(lexer);
            }
            if (lexer->lookahead == '\n' || lexer->eof(lexer)) {
                skip(lexer);
            } else {
                return false;
            }
        } else {
            break;
        }
    }

    lexer->mark_end(lexer);

    if (found_end_of_line) {
        if (scanner->indents.size > 0) {
            uint16_t current_indent_length = *array_back(&scanner->indents);

            if (valid_symbols[INDENT] && indent_length > current_indent_length) {
                array_push(&scanner->indents, indent_length);
                lexer->result_symbol = INDENT;
                return true;
            }

            if (valid_symbols[DEDENT] && indent_length < current_indent_length) {
                while(current_indent_length > indent_length) {
                    scanner->dedents += 1;
                    array_pop(&scanner->indents);
                    current_indent_length = *array_back(&scanner->indents);
                }
                lexer->result_symbol = DEDENT;
                return true;
            }
        }
        if (valid_symbols[NEWLINE]) {
            lexer->result_symbol = NEWLINE;
            return true;
        }
    } else {
        if(lexer->eof(lexer) && valid_symbols[DEDENT] && scanner->indents.size > 0) {
            array_pop(&scanner->indents);
            lexer->result_symbol = DEDENT;
            return true;
        }
    }
    return false;
}

unsigned tree_sitter_automn_external_scanner_serialize(void *payload, char *buffer) {
    Scanner *scanner = (Scanner *)payload;
    size_t size = 0;

    buffer[0] = (char)scanner->dedents;
    size += sizeof(scanner->dedents);
    buffer[size++] = (char)scanner->final_newlined;

    uint32_t iter = 1;
    for (; iter < scanner->indents.size && size < TREE_SITTER_SERIALIZATION_BUFFER_SIZE; ++iter) {
        uint16_t indent_value = *array_get(&scanner->indents, iter);
        buffer[size++] = (char)(indent_value & 0xFF);
        buffer[size++] = (char)((indent_value >> 8) & 0xFF);
    }

    return size;
}

void tree_sitter_automn_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;

    array_delete(&scanner->indents);
    array_push(&scanner->indents, 0);

    if (length > 0) {
        size_t size = 0;
        scanner->dedents = (uint16_t)buffer[0];
        size += sizeof(scanner->dedents);
        scanner->final_newlined = (bool)buffer[size++];
        for (; size + 1 < length; size += 2) {
            uint16_t indent_value = (unsigned char)buffer[size] | ((unsigned char)buffer[size + 1] << 8);
            array_push(&scanner->indents, indent_value);
        }
    }
}

void *tree_sitter_automn_external_scanner_create() {
    Scanner *scanner = calloc(1, sizeof(Scanner));
    scanner->dedents = 0;
    array_init(&scanner->indents);
    tree_sitter_automn_external_scanner_deserialize(scanner, NULL, 0);
    return scanner;
}

void tree_sitter_automn_external_scanner_destroy(void *payload) {
    Scanner *scanner = (Scanner *)payload;
    array_delete(&scanner->indents);
    free(scanner);
}
