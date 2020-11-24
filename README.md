# boydog no OT

This is the pipeline:
on html input -> update front flat scope (non-reactive reference) -> server scope -> update front flat scope (if different) -> update html

There is a scope in html and it is flat. The server scope is deep.

Interesting resources:

 - Simple two way binding: https://www.npmjs.com/package/two-way-binding
 - Two way binding with for loop: https://blikblum.github.io/tinybind/docs/guide/
 - Seems the same as above: https://github.com/mikeric/rivets