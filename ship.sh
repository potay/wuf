#!/bin/bash
set -e

PROJECT=fattytoro
REGION=us-central1
SERVICE=wuf

echo "🐾 Shipping Wuf to Cloud Run..."
gcloud run services replace <(cat <<YAML
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: $SERVICE
spec:
  template:
    spec:
      containers:
        - image: us-central1-docker.pkg.dev/$PROJECT/cloud-run-source-deploy/$SERVICE:latest
          ports:
            - containerPort: 8080
          env:
            - name: FIREBASE_PROJECT_ID
              value: $PROJECT
          resources:
            limits:
              memory: 512Mi
YAML
) --project=$PROJECT --region=$REGION

echo "🐾 Wuf is live!"
