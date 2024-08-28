FROM docker:20.10.14

RUN apk add --no-cache bash docker-compose

COPY src/health_check.sh /health_check.sh
RUN chmod +x /health_check.sh

ENTRYPOINT ["/health_check.sh"]