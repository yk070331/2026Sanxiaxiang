"""Compatibility launcher for the bundled ReportLab runtime."""

import os
import runpy

import reportlab.platypus
from reportlab.platypus.doctemplate import BaseDocTemplate
from reportlab.platypus.tableofcontents import TableOfContents


reportlab.platypus.TableOfContents = TableOfContents

_original_init = BaseDocTemplate.__init__


def _path_compatible_init(self, filename, *args, **kwargs):
    return _original_init(self, os.fspath(filename), *args, **kwargs)


BaseDocTemplate.__init__ = _path_compatible_init
runpy.run_path("scripts/generate_competition_pdfs.py", run_name="__main__")
