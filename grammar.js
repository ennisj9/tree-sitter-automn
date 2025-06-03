/**
 * @file A language for definining data structures and models
 * @author Joseph Ennis <joe@ennisj.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const name = /[a-zA-Z_][a-zA-Z0-9_-]*/;

module.exports = grammar({
  name: "automn",
  externals: ($) => [$.indent, $.dedent, $.newline],
  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) => repeat(seq(repeat($.newline), $._definition)),
    _definition: ($) => choice($.model),
    model: ($) => seq($.name, optional($._model_body)),
    _model_body: ($) =>
      seq(
        $.indent,
        $._model_child_definition,
        repeat(seq($.newline, $._model_child_definition)),
        $.dedent,
      ),
    _model_child_definition: ($) => choice($.field),
    field: ($) => seq($.name, optional($._type_declaration)),
    /** TYPES */
    _type_declaration: ($) => seq(":", $.type),
    type: ($) => $._any_type,
    _any_type: ($) =>
      choice($.atomic_type, $.inline_enum, $.array_of_type, $.type_union),
    _non_union_type: ($) =>
      choice($.atomic_type, $.inline_enum, $.array_of_type),
    inline_enum: ($) =>
      prec.left(2, seq($.variant, repeat1(seq(",", $.variant)))),
    array_of_type: ($) => seq("[", $._any_type, "]"),
    type_union: ($) =>
      prec.left(
        1,
        seq($._non_union_type, repeat1(seq("|", $._non_union_type))),
      ),
    atomic_type: ($) => name,
    variant: ($) => name,
    name: ($) => name,
  },
});
