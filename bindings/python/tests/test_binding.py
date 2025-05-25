from unittest import TestCase

import tree_sitter
import tree_sitter_automn


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_automn.language())
        except Exception:
            self.fail("Error loading automn grammar")
