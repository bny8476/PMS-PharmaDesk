#!/bin/bash
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi
./mvnw spring-boot:run -Dmaven.test.skip=true
