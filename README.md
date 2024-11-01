# `setup-go-tool` action

The `isometry/setup-go-tool` action is designed to install and cache Go tools, making them available in your GitHub Actions workflows.
The action ensures that the specified Go module is installed and added to the system PATH, leveraging GitHub Runners' Tool Cache mechanism for efficiency.

Potentially most useful for private, Kubernetes-based GitHub Runners where a Docker runtime is not available.

## Features

* Installs specified Go tool optimised for the active GitHub Runner
* Fully exploits GitHub Runners' Tool Cache mechanism

## Inputs

### `module` input

**Required** The name of the Go module to install (example: `github.com/containers/skopeo/cmd/skopeo`)

### `version` input

**Required** The version of the Go module to install (default: `latest`; example: `v1.2.3`)

### `name` input

**Optional** The name to use for caching the module. Defaults to the last component in the module path, with stripping of a final `/cmd` component (example: `tool` for `github.com/owner/tool/cmd`)

### `go-version` input

**Optional** The version of Go to use (default: `stable`)

### `cgo` input

**Optional** Enable CGO (default: `false`)

### `flags` input

**Optional** Build flags to use (default: `-trimpath`)

### `ldflags` input

**Optional** Build ldflags to use (default: `-s -w`)

### `tags` input

**Optional** Build tags to use (default: `""`)

## Outputs

### `version` output

The version of the tool actually installed.

## Example usage

```yaml
name: example

on:
  workflow_dispatch:

jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - name: Setup skopeo
        uses: isometry/setup-go-tool@v1
        with:
          module: github.com/containers/skopeo/cmd/skopeo
          tags: containers_image_openpgp

      - name: Verify installation
        run: |
          which skopeo
          skopeo --version
