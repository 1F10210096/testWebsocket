# ベースイメージを選択
FROM node:16

# パッケージを更新
RUN apt-get update -y

# 必要なパッケージをインストール
RUN apt-get install -y --no-install-recommends \
    curl \
    openjdk-11-jre-headless

# Firebase CLIをインストール
RUN npm install -g firebase-tools

# 作業ディレクトリを設定
WORKDIR /opt/workspace/

# プロジェクトファイルをコピー
COPY . /opt/workspace/