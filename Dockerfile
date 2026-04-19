FROM node:24-slim

# Install Java, gcloud CLI, and other dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless \
    curl \
    unzip \
    git \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Cloud SDK (includes gsutil)
RUN curl -fsSL https://dl.google.com/dl/cloudsdk/channels/rapid/google-cloud-sdk.tar.gz -o /tmp/gcloud.tar.gz && \
    tar -xf /tmp/gcloud.tar.gz -C /opt && \
    /opt/google-cloud-sdk/install.sh --quiet --path-update true && \
    rm /tmp/gcloud.tar.gz
ENV PATH="/opt/google-cloud-sdk/bin:${PATH}"

# Set environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${PATH}"

# Install Android SDK command-line tools
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/cmdline-tools.zip && \
    unzip /tmp/cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools && \
    mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip

# Accept Android licenses and install required SDK components
RUN yes | sdkmanager --licenses > /dev/null 2>&1 && \
    sdkmanager \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;36.1.0" \
    "ndk;27.1.12297006" \
    "cmake;3.22.1"

WORKDIR /app