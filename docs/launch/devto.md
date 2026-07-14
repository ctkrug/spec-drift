---
title: "I built a browser tool that reads an OpenAPI diff and tells you what actually breaks"
published: false
tags: openapi, typescript, webdev, api
---

Every time I cut a release of an API, the same small dread shows up: did I break someone?
The spec changed, the tests pass, but "the tests pass" only covers the clients I control.
The partner who wired up their integration eight months ago is not in my test suite.

The usual answer is to diff the two OpenAPI files. That tells you *that* something changed.
It does not tell you whether a client breaks. A field going from optional to required looks
identical, in a text diff, to a reworded description. So I built [Spec Drift](https://apps.charliekrug.com/spec-drift/):
paste the old and new spec, get a plain-English report that classifies every change as
breaking or safe. No upload, no account, it runs entirely in the browser.

Two decisions turned out more interesting than I expected.

## Breaking is directional

The naive model is "removing things is breaking, adding things is safe." That is wrong the
moment you notice a request body and a response body are read from opposite ends.

For a **request**, the client is the writer. Narrowing a field's type is breaking: a client
still sending the old type now gets a 400. Widening it is safe. Adding a *required* field is
breaking; adding an optional one is safe.

For a **response**, the client is the reader, so it flips. *Removing* a field is breaking
(the client that read it now gets `undefined`). *Widening* a response type is breaking, not
safe, because a client that only ever handled the old type can now be handed something it
never coded for. Making a response field optional is breaking too, since "always present"
was part of the contract the client relied on.

So the same structural edit ("this property's type set grew") is a safe change on a request
and a breaking change on a response. Encoding that asymmetry, rather than a single
symmetric diff, is most of what makes the report trustworthy. The classifier lives in one
file (`schema.ts`) and produces sentences with the actual consequence baked in, like
`"assignee_id" became required, so any client not sending it will now get a 400`.

## A YAML file can crash your recursive diff

The diff walks nested schema `properties` recursively to catch a change buried under
`address.zip`. That is fine until someone pastes a spec that uses a YAML anchor to reference
itself:

```yaml
schema: &node
  type: object
  properties:
    child: *node
```

`js-yaml` resolves an alias to the *same object instance*, not a copy. So `schema.properties.child`
is `schema`. My recursive walk followed that forever and blew the stack, taking the whole tab
down. This is untrusted input (the entire product is "paste a stranger's spec"), so a crash
on a hostile document is a real bug, not a curiosity.

The fix is a depth cap. Real schemas never nest 64 levels deep, so past that the walk stops.
I found this by writing an adversarial test that builds exactly that circular object and
asserts the diff returns instead of throwing. That test drove the fix, and two sibling crash
bugs (malformed `parameters` arrays, a null path item from `/x:` with nothing under it) came
out of the same "what if the input is garbage" pass.

## What I'd do differently

The share feature encodes both specs into the URL fragment so a report reproduces with no
backend. It is genuinely stateless and I like that, but it caps out around a 6000-character
link. For big enterprise specs that is too small. A future version would compress the payload
before base64, which would buy a lot of headroom for free.

The whole thing is TypeScript, Vite, and Vitest, MIT licensed. Code and specs never leave
your browser.

- Try it: <https://apps.charliekrug.com/spec-drift/>
- Source: <https://github.com/ctkrug/spec-drift>

If you maintain a versioned API, I'd love to know which breaking-change rule you'd add next.
