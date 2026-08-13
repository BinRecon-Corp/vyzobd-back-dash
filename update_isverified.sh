#!/bin/bash
find src/backend -type f -name "*.ts" -exec sed -i 's/isVerified:/emailVerified:/g' {} +
find src/backend -type f -name "*.ts" -exec sed -i 's/\.isVerified/\.emailVerified/g' {} +
