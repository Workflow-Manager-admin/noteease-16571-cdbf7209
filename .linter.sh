#!/bin/bash
cd /home/kavia/workspace/code-generation/noteease-16571-cdbf7209/noteease
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

