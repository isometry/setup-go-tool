import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from '@actions/exec';

if (require.main === module) {
    main().catch(err => {
        console.error(err.stack);
        process.exit(1);
    });
}

async function main(): Promise<void> {
    try {
        const moduleName = core.getInput('module');
        let version = core.getInput('version');
        let tool = core.getInput('name');
        const cgoEnabled = core.getInput('cgo');
        const flags = core.getInput('flags');
        const ldflags = core.getInput('ldflags');
        const tags = core.getInput('tags');

        if (!moduleName || !version) {
            throw new Error('Input parameters `module` and `version` are required.');
        }

        if (!tool) {
            const parts = moduleName.split('/');
            tool = parts.pop()!;
            if (tool === 'cmd' && parts.length > 0) {
                tool = parts.pop()!;
            }
        }

        // resolve the actual version if 'latest' is specified
        if (version === 'latest') {
            // reduce module name to fqdn/owner/repo for go list
            let rootName = moduleName.split('/').slice(0, 3).join('/');
            let latest = '';
            await exec('go', ['list', '-u', '-m', '-f', '{{.Version}}', `${rootName}@latest`], {
                listeners: {
                    stdout: (data: Buffer) => {
                        latest += data.toString();
                    }
                }
            });
            if (latest) {
                version = latest.trim();
            } else {
                throw new Error(`Unable to determine latest version for ${moduleName}`);
            }
        }

        let cachePath = tc.find(tool, version);

        if (!cachePath) {
            const gobin = fs.mkdtempSync(path.join(os.tmpdir(), 'gobin-'));
            process.env.GOBIN = gobin;
            if (cgoEnabled === 'false') {
                process.env.CGO_ENABLED = '0';
            }

            core.info(`Installing ${moduleName}@${version}`);
            await exec('go', ['install', ...flags.split(' '), `-ldflags=${ldflags}`, `-tags=${tags}`, `${moduleName}@${version}`]);

            const binPath = path.join(gobin, tool);

            if (!fs.existsSync(binPath)) {
                throw new Error(`Binary '${tool}' not found after installation`);
            }

            cachePath = await tc.cacheFile(binPath, tool, tool, version);
        }

        core.addPath(cachePath);
        core.setOutput('version', version);
        core.info(`Installed ${moduleName} version ${version} as ${tool}`);
    } catch (err) {
        core.setFailed(`Action failed with error ${err}`);
    }
}
