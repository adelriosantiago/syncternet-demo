# boydog no OT

This is the pipeline:
on html input -> update front flat scope (non-reactive reference) -> server scope -> update front flat scope (if different) -> update html

There is a scope in html and it is flat. The server scope is deep.

Interesting resources:

 - Simple two way binding: https://www.npmjs.com/package/two-way-binding
 - Two way binding with for loop: https://blikblum.github.io/tinybind/docs/guide/
 - Seems the same as above: https://github.com/mikeric/rivets

## Internals

This section describes how each attribute works internally.
### Looping (`bd-loop`):

Given the scope:

```js
let scope = {
  "text": "should not match this",
  "items>0>todo": "get milk",
  "items>1>todo": "buy meat",
  "items>2>todo": "fix car",
}
```

And the HTML:

```html
<li bd-loop="items>\d+>">
    <p>todo: <input bd-value="$$todo" /></p>
</li>
```

We expect the resulting HTML to be:

```html
<li bd-loop="items>\d+>" _bd-last-matches="3">
    <p>todo: <input bd-value="items>0>todo" _bd-value-original="$$todo" /></p>
</li>
<li>
    <p>todo: <input bd-value="items>1>todo" /></p>
</li>
<li>
    <p>todo: <input bd-value="items>2>todo" /></p>
</li>
```

---

This process, step by step happened as follows. Given the initial HTML,

```html
<li bd-loop="items>\d+>">
    <p>todo: <input bd-value="$$todo" /></p>
</li>
```

Preemptively get all matches and save them as  `matches`. If `matches.length` is different to `_bd-last-matches` or if there is no such attribute, then continue. Check that this is a valid loop by validating that the parent has only 1 children, and this children has a `bd-loop` attribute.

```html
<li bd-loop="items>\d+>">
    <p>todo: <input bd-value="$$todo" /></p>
</li>
```

The looping structure is saved as `blueprintView` without the `bd-loop` attribute. Therefore `blueprintView` is equal to:

```html
<li>
    <p>todo: <input bd-value="$$todo" /></p>
</li>
```

Returning to the initial HTML, this element's children are scanned for any `bd-*` attribute that contains `$$`, `$>` or `$<` and that is directly under the `bd-loop` we are processing. Since there are matches, each found instance gets this attribute copied into `_bd-[type]-original` resulting in:

```html
<li bd-loop="items>\d+>">
    <p>todo: <input bd-value="$$todo" _bd-value-original="$$todo"/></p>
</li>
```

Since `matches` is `["items>0>", "items>1>", "items>2>"]` and its length is 3. Add this to `_bd-last-matches`. Then create and append 2 more instances of `blueprintView`. Code so far:

```html
<li bd-loop="items>\d+>" _bd-last-matches="3">
    <p>todo: <input bd-value="$$todo" _bd-value-original="$$todo"/></p>
</li>
<li>
    <p>todo: <input bd-value="$$todo" /></p>
</li>
<li>
    <p>todo: <input bd-value="$$todo" /></p>
</li>
```

Iterate again each children while replacing any `$$`, `$>` or `$<` found by the value from the matches. Resulting in:

```html
<li bd-loop="items>\d+>" _bd-last-matches="3">
    <p>todo: <input bd-value="items>0>todo" _bd-value-original="$$todo" /></p>
</li>
<li>
    <p>todo: <input bd-value="items>1>todo" /></p>
</li>
<li>
    <p>todo: <input bd-value="items>2>todo" /></p>
</li>
```

The structure above is now good to be processed by the binder.



