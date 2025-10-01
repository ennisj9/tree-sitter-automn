(model (identifier) @constructor)
(mixin (identifier) @type)
(enum (identifier) @enum)
(associated_model (identifier) @constructor)
(field (identifier) @variable)
(function (identifier) @function)
(method_function (identifier) @function)
(return_field (identifier) @variable.special)
(atomic_type (identifier) @type)
(variant_identifier) @variant
(context_type) @variable.special
(dynamic_field_name) @variable.parameter
(symbol) @constant
(string) @string
(template ("`") @string)
(template_string_fragment) @string
(template_escape_sequence) @string.escape
(null) @keyword
(tag) @tag
(property_key) @property
(documentation) @string.documentation
[
  (true)
  (false)
] @keyword
(number) @number
(open_caret) @punctuation.bracket
(template_open_caret) @punctuation.bracket
(close_caret) @punctuation.bracket
(close_caret_operator) @operator
(right_arrow) @operator
[
":"
","
"="
"::"
"~"
"?"
"|"
] @punctuation
[
"["
"]"
"{"
"}"
"("
")"
] @punctuation.bracket
[
">>"
"/"
"&"
] @operator
