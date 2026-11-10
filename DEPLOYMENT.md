# AWS Academy EC2へのデプロイ

このアプリはReact/ViteのフロントエンドとExpress APIで構成されています。本番環境ではExpressが`dist/`を配信するため、Viteの開発サーバーではなくNode.jsサーバーを起動します。

## 事前確認

- AWS Academy Learner Labを開始し、AWSコンソールを開きます。
- Learner Labごとに利用可能なリージョン、インスタンスタイプ、IAM権限、予算などが異なります。Labの案内に従ってください。
- デプロイするコードをGitHubにpushしておきます。ローカルにしかない変更はEC2から取得できません。
- Gemini APIを使う場合は、利用可能なGemini APIキーを用意します。

## 1. EC2インスタンスを作成

1. EC2でUbuntu Server 24.04 LTSのインスタンスを作成します。
2. Labで許可されているインスタンスタイプを選択します。ビルドと実行には、利用可能であればメモリ2GB程度を目安にしてください。
3. SSH接続用のキーペアを作成し、安全な場所に保管します。
4. セキュリティグループのインバウンドルールを設定します。
   - SSH（TCP 22）：自分のIPアドレスからのみ許可します。
   - HTTP（TCP 80）とHTTPS（TCP 443）：Nginxなどをリバースプロキシとして使う場合に許可します。
   - アプリのTCP 3000番：初期動作確認で直接アクセスする場合に限り、一時的に自分のIPから許可します。本番では直接公開せず、リバースプロキシ経由にします。

SSHを`0.0.0.0/0`（すべての送信元）に公開しないでください。詳細は[AWSのEC2セキュリティグループの説明](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html)を参照してください。

## 2. EC2に接続してアプリを配置

EC2コンソールの「接続」画面に表示される方法でSSH接続します。以下はUbuntuの例です。

```bash
sudo apt update
sudo apt install -y git
```

Vite 8に対応するNode.js 22をインストールします。NodeSourceを使う場合：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
rm /tmp/nodesource_setup.sh
sudo apt install -y nodejs
node -v
npm -v
```

リポジトリを取得してビルドします。

```bash
git clone https://github.com/skawashin1122/sea-mountains.git
cd sea-mountains
npm install
npm run build
```

`package-lock.json`がGitHubに含まれている場合は、再現性のため`npm install`の代わりに`npm ci`を使えます。このプロジェクトの`npm start`は開発依存パッケージの`tsx`を利用するため、`npm ci --omit=dev`では起動できません。

## 3. Gemini APIキーを設定

APIキーはサーバー側の環境変数`GEMINI_API_KEY`として設定します。ソースコードやGitHubに書き込まず、EC2上の環境ファイルに保管してください。

```bash
sudo install -d -m 700 /etc/sea-mountains
sudoedit /etc/sea-mountains/app.env
```

編集画面で、以下のように実際のキーを入力します。

```text
GEMINI_API_KEY=実際のAPIキー
NODE_ENV=production
PORT=3000
```

保存したら、ファイルをrootユーザーだけが読めるようにします。

```bash
sudo chmod 600 /etc/sea-mountains/app.env
```

## 4. systemdでアプリを起動

サービス定義ファイルを作成します。

```bash
sudoedit /etc/systemd/system/sea-mountains.service
```

以下を記入します。ユーザー名や配置先を変更した場合は、`User`と`WorkingDirectory`も合わせて変更してください。

```ini
[Unit]
Description=Sea Mountains app
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/sea-mountains
EnvironmentFile=/etc/sea-mountains/app.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

サービスを登録して起動します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sea-mountains
sudo systemctl status sea-mountains
```

EC2内部からヘルスチェックを行います。

```bash
curl http://127.0.0.1:3000/api/health
```

ログを確認するには：

```bash
sudo journalctl -u sea-mountains -f
```

初期確認のために3000番を一時公開した場合は、`http://EC2のパブリックIPv4アドレス:3000`にアクセスできます。確認後はセキュリティグループから3000番のルールを削除してください。

## 5. 公開時の注意

- 継続して公開する場合は、NginxなどをTCP 80/443で受け、アプリの3000番へ転送する構成にしてください。3000番は外部公開しないようにします。HTTPSにはドメインとTLS証明書が必要です。
- EC2のパブリックIPv4アドレスは、停止・再起動で変わる場合があります。固定アドレスが必要なら、LabでElastic IPを使えるか、費用も含めて確認してください。
- Learner Labの一時的なAWS認証情報をEC2にコピーしないでください。Gemini APIキーもGitにコミットしないでください。
- Gemini APIを利用するには、EC2から外部APIへの通信が必要です。APIキーの利用量、料金、上限も確認してください。
- Labの予算や利用期間に注意し、使い終わったインスタンスなどのリソースは停止または削除してください。停止してもEBSなどのリソースに料金が発生する場合があります。

## 更新時

GitHubに変更をpushした後、EC2で次のように更新してサービスを再起動します。

```bash
cd /home/ubuntu/sea-mountains
git pull
npm install
npm run build
sudo systemctl restart sea-mountains
sudo systemctl status sea-mountains
```

`package-lock.json`を使う場合は、更新時も`npm install`を`npm ci`に置き換えられます。
