#!/usr/bin/env python3
"""Regenerate k8s/liquibase-configmap.yaml from the liquibase/ directory.

The ConfigMap stores each changelog under its basename (keys cannot contain
'/'). The migration Job's volume `items` maps those keys back to the
migrations/ and seeds/ paths. Run this after editing any liquibase file:

    python3 k8s/generate-liquibase-configmap.py
    kubectl apply -f k8s/liquibase-configmap.yaml
"""
import os
import glob

ROOT = os.path.join(os.path.dirname(__file__), '..', 'liquibase')
OUT = os.path.join(os.path.dirname(__file__), 'liquibase-configmap.yaml')
SKIP = {'Dockerfile', 'AGENTS.md', '.dockerignore'}


def main() -> None:
    files = []
    for path in glob.glob(os.path.join(ROOT, '**', '*'), recursive=True):
        if not os.path.isfile(path):
            continue
        base = os.path.basename(path)
        if base in SKIP:
            continue
        rel = os.path.relpath(path, ROOT)
        files.append((base, rel))
    files.sort(key=lambda item: item[1])

    data = []
    for base, rel in files:
        with open(os.path.join(ROOT, rel), encoding='utf-8') as handle:
            body = handle.read()
        indented = '\n'.join('    ' + line for line in body.splitlines())
        data.append('  ' + base + ': |\n' + indented + '\n')

    header = [
        'apiVersion: v1',
        'kind: ConfigMap',
        'metadata:',
        '  name: liquibase-changelogs',
        '  namespace: expenses',
        'data:',
    ]
    with open(OUT, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(header) + '\n' + '\n'.join(data).rstrip() + '\n')
    print('wrote ' + OUT + ' (' + str(len(files)) + ' files)')


if __name__ == '__main__':
    main()