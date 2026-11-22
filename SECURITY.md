# Security

## Reporting a vulnerability

Please report it privately: on this repository, open **Security → Report a vulnerability**. Do not open a public issue.

Include the workflow that shows the problem (or a minimal one), what you expected, and what happened.

## Scope

This repository: the `mcpcheck-action` GitHub Action — `action.yml`, the files it runs, and its own workflows. Problems in the mcpcheck CLI itself belong in [rajanaggarwal11/mcpcheck](https://github.com/rajanaggarwal11/mcpcheck).

A local (stdio) server is a program running on the runner with the job's access; what such code can do to the job is outside what this action can prevent (see the README, "Servers you do not control"). Hostile remote servers and hostile tool metadata are in scope.

Examples that are in scope: a remote server under test forging the step's outputs or annotations, markup injected into the job summary, the action running a different mcpcheck than the one it pins.

## Supported versions

The latest major version (`v1`). Fixes ship as a new v1 release; older tags are not patched.
