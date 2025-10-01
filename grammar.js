/**
 * @file A language for definining data structures and models
 * @author Joseph Ennis <joe@ennisj.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const identifier = /[a-zA-Z_][a-zA-Z0-9_-]*/;

module.exports = grammar({
  name: "automn",
  externals: ($) => [$.indent, $.dedent, $.newline, $.end],
  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) => repeat(seq($._definition, repeat($.newline))),
    _definition: ($) => choice($.model, $.function, $.enum),

    /** MODEL */
    model: ($) =>
      seq(
        $.identifier,
        repeat(choice($._atomic_value, $.mixin)),
        choice($._model_body, $.newline),
      ),
    _model_body: ($) =>
      seq(
        $.indent,
        $._model_child_definition,
        repeat(seq($.newline, $._model_child_definition)),
        $.dedent,
      ),
    _model_child_definition: ($) =>
      choice($.field, $._describer, $.method_function, $.associated_model),
    associated_model: ($) =>
      seq(
        "/",
        $.identifier,
        repeat($._atomic_value),
        choice($._model_body, $.newline),
      ),
    mixin: ($) => seq("&", $.identifier),
    /** FIELD */
    field: ($) =>
      seq(
        choice($.identifier, $._dynamic_field),
        optional($._type_declaration),
        optional($._example_declaration),
        optional($._literal_declaration),
        optional($._field_body),
      ),
    _field_body: ($) =>
      seq(
        $.indent,
        $._field_child_definition,
        repeat(seq($.newline, $._field_child_definition)),
        $.dedent,
      ),
    _field_child_definition: ($) =>
      choice(
        $._describer,
        $._type_declaration,
        $._example_declaration,
        $._literal_declaration,
        seq(":", $.context_type, ":", $.type),
      ),
    _dynamic_field: ($) =>
      seq(
        $.open_caret,
        $.dynamic_field_name,
        optional($._type_declaration),
        $.close_caret,
      ),
    _literal_declaration: ($) => seq("=", $._value),
    _example_declaration: ($) => seq("~", $._value),

    /** FUNCTION */
    function: ($) =>
      seq(seq($.identifier, "(", ")"), choice($._function_body, $.newline)),
    method_function: ($) =>
      seq(seq($.identifier, "(", ")"), optional($._function_body)),
    _function_body: ($) =>
      seq(
        $.indent,
        $._function_child_definition,
        repeat(seq($.newline, $._function_child_definition)),
        $.dedent,
      ),
    _function_child_definition: ($) =>
      choice($.field, $._describer, $.return_field),
    right_arrow: ($) => "->",
    return_field: ($) =>
      seq(
        $.right_arrow,
        $.identifier,
        optional($._type_declaration),
        optional($._example_declaration),
        optional($._literal_declaration),
        optional($._field_body),
      ),
    /** ENUM */
    enum: ($) =>
      seq(
        "|",
        $.identifier,
        optional($._type_declaration),
        choice($.newline, $._enum_body),
      ),
    _enum_body: ($) =>
      seq(
        $.indent,
        choice($.variant, $._describer),
        repeat(seq($.newline, choice($.variant, $._describer))),
        $.dedent,
      ),
    variant: ($) =>
      seq(
        $.variant_identifier,
        optional($._variant_parameters),
        optional($._literal_declaration),
        optional($._variant_body),
      ),
    _variant_body: ($) => seq($.indent, $.dedent),
    _variant_child_definition: ($) =>
      choice($._describer, $._literal_declaration),
    _variant_parameters: ($) =>
      seq("(", $._non_enum_type, repeat(seq(",", $._non_enum_type)), ")"),
    /** DESCRIPTIONS */
    _describer: ($) =>
      choice(
        $._tags,
        $._property,
        $._single_documentation,
        $._multi_documentation,
      ),
    _single_documentation: ($) => seq($.close_caret_operator, $.documentation),
    _multi_documentation: ($) =>
      seq(">>", $.indent, $._multi_documentation_body, $.dedent),
    _multi_documentation_body: ($) =>
      seq($.documentation, repeat(seq($.newline, $.documentation))),
    documentation: ($) => /[^\n\r]*/,
    _property: ($) => seq($.property_key, "::", $._value),
    property_key: ($) => identifier,
    _tags: ($) => seq("[", optional(seq($.tag, repeat(seq(",", $.tag)))), "]"),
    tag: ($) => identifier,
    /** TYPES */
    _type_declaration: ($) => seq(choice(":", seq("?", optional(":"))), $.type),
    type: ($) => $._any_type,
    atomic_type: ($) =>
      seq(
        $.identifier,
        optional(
          seq("(", $._atomic_value, repeat(seq(",", $._atomic_value)), ")"),
        ),
      ),
    _non_enum_type: ($) =>
      choice($.atomic_type, $._array_of_non_enum_type, $._non_enum_type_union),
    _non_enum_type_union: ($) =>
      prec.left(
        1,
        seq(
          $._non_union_non_enum_type,
          repeat1(seq("|", $._non_union_non_enum_type)),
        ),
      ),
    _array_of_non_enum_type: ($) => seq("[", $._non_enum_type, "]"),
    _any_type: ($) =>
      choice($.atomic_type, $.inline_enum, $.array_of_type, $.type_union),
    _non_union_type: ($) =>
      choice($.atomic_type, $.inline_enum, $.array_of_type),
    _non_union_non_enum_type: ($) =>
      choice($.atomic_type, $._array_of_non_enum_type),
    inline_enum: ($) =>
      prec.left(
        2,
        seq($.variant_identifier, repeat1(seq(",", $.variant_identifier))),
      ),

    array_of_type: ($) => seq("[", $._any_type, "]"),
    type_union: ($) =>
      prec.left(
        1,
        seq($._non_union_type, repeat1(seq("|", $._non_union_type))),
      ),
    //** VALUES */
    _object_key_value: ($) => seq(choice($.string, $.symbol), ":", $._value),
    object: ($) =>
      seq(
        "{",
        optional(
          seq($._object_key_value, repeat(seq(",", $._object_key_value))),
        ),
        "}",
      ),
    array: ($) =>
      seq("[", optional(seq($._value, repeat(seq(",", $._value)))), "]"),
    _unescaped_double_string_fragment: (_) =>
      token.immediate(prec(1, /[^"\\\r\n]+/)),
    _escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[^xu0-7]/,
            /[0-7]{1,3}/,
            /x[0-9a-fA-F]{2}/,
            /u[0-9a-fA-F]{4}/,
            /u\{[0-9a-fA-F]+\}/,
            /[\r?][\n\u2028\u2029]/,
          ),
        ),
      ),
    string: ($) =>
      choice(
        seq(
          '"',
          repeat(
            choice($._unescaped_double_string_fragment, $._escape_sequence),
          ),
          '"',
        ),
      ),
    _atomic_value: ($) =>
      choice(
        $.string,
        prec(2, $.true),
        prec(2, $.false),
        prec(2, $.null),
        $.number,
        prec(1, $.symbol),
        $.path,
      ),
    path: ($) => seq("!", repeat1(choice($.path_literal, $._path_dynamic))),
    path_literal: ($) =>
      prec(4, token.immediate(/[A-Za-z0-9\-\._~:/?#\[\]@!$&'()*+,;=%]+/)),
    _path_dynamic: ($) =>
      seq(
        $.path_open_caret,
        $.dynamic_field_name,
        optional($._type_declaration),
        optional($._example_declaration),
        $.close_caret,
      ),
    dynamic_field_name: ($) => identifier,
    path_open_caret: ($) => token.immediate("<"),
    open_caret: ($) => "<",
    close_caret: ($) => ">",
    close_caret_operator: ($) => ">",
    _value: ($) => choice($.object, $.array, $._atomic_value),
    true: ($) => "true",
    false: ($) => "false",
    null: ($) => "null",
    number: ($) => /-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/,
    //** IDENTIFIERS */
    context_type: ($) => identifier,
    symbol: ($) => identifier,
    identifier: ($) => identifier,
    variant_identifier: ($) => prec(1, identifier),
  },
});
