# boydog no OT

This is the pipeline:

- On html input
- Update front flat scope (non-reactive reference)
- Update server scope
- Update front flat scope (if different)
- Update html

Both scopes, front and back are flat.

Interesting resources:

 - Simple two way binding: https://www.npmjs.com/package/two-way-binding
 - Two way binding with for loop: https://blikblum.github.io/tinybind/docs/guide/
 - Seems the same as above: https://github.com/mikeric/rivets

## Internals

This section describes how each attribute works internally.
### Looping (`bd-loop`):

Given the server scope:

```js
let scope = {
  "text": "should not match this",
  "items>0>todo": "get milk",
  "items>1>todo": "buy meat",
  "items>2>todo": "fix car",
}
```

And the client HTML:

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

check if there is a `bdBlueprintView` variable inside the element. If there is not, then save one removing the `bd-loop` attribute. Therefore `bdBlueprintView` of the DOM element should now be equal to:

```html
<li>
    <p>todo: <input bd-value="$$todo" /></p>
</li>
```

Preemptively get all matches and save them, in this example `matches = ["items>0>", "items>1>", "items>2>"]`. If `matches.length` is equal to the  `_bd-last-matches` attribute then bailout as there is no need to bake again the structure when the length has not changed.

Returning back to the initial HTML and assuming that `_bd-last-matches` didn't exist or it was different from `matches` , save this number into the looping element.

```html
<li bd-loop="items>\d+>" _bd-last-matches"3">
    <p>todo: <input bd-value="$$todo" _bd-value-original="$$todo"/></p>
</li>
```

This element's children are scanned for any `bd-*` attribute that contains `$$`, `$>` or `$<` <u>that is directly under the `bd-loop` we are processing</u>. Since there one match, save it into `_bd-[type]-original`:

```html
<li bd-loop="items>\d+>">
    <p>todo: <input bd-value="$$todo" _bd-value-original="$$todo"/></p>
</li>
```

Since `matches.length` is 3, clone and append 2 more instances of `bdBlueprintView`:

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

Iterate again each children while regex replacing any `$$`, `$>` or `$<` found by the value from the matches. This results in:

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

## SO resources:

 - https://stackoverflow.com/questions/5100376/how-to-watch-for-array-changes