[English](README.md) · [Deutsch](README.de.md) · [中文](README.zh.md) · **日本語** · [Español](README.es.md) · [Français](README.fr.md)

# Obsidian Health Sync

フィットネストラッカーから歩数、睡眠、心拍数、ストレス、アクティビティなどを自動的に Obsidian Daily Notes に同期します。Dataview で検索可能な frontmatter プロパティとして記録されます。

> **デスクトップ専用。** このプラグインは認証に Electron の BrowserWindow を使用するため、モバイルでは動作しません。

## 対応プロバイダー

- **Garmin Connect** — 通常の Garmin アカウントでログイン、API キー不要

今後さらに多くのプロバイダー（Fitbit、Oura、Whoop）に対応予定です。

## 機能

- **起動時の自動同期** — 過去7日間をチェックし、欠落している健康データを補完
- **手動同期** — コマンドパレットから開いている Daily Note を同期
- **バックフィル** — 日付範囲の一括同期（例：過去3ヶ月分）
- **20以上の指標** — 歩数、睡眠スコア、HRV、ストレス、Body Battery、SpO2、体重など
- **アクティビティ追跡** — 各ワークアウトが読みやすいサマリーとして表示
- **ワークアウトの場所** — 最初の GPS アクティビティから逆ジオコーディングで取得した地名
- **スマート検出** — Periodic Notes または内蔵の Daily Notes プラグインから Daily Notes のパスとフォーマットを自動検出
- **サブディレクトリ対応** — ネストされたフォルダ内の既存 Daily Notes を検索（例：`Journal/2024-07/`）
- **言語自動検出** — UI 言語は Obsidian の言語設定に基づいて自動設定（EN、DE、ZH、JA、ES、FR）
- **オプションの構造化データ** — 高度な Dataview クエリ用の機械可読 `trainings` フィールド

## Frontmatter 出力

### 指標

```yaml
---
steps: 15185
resting_hr: 69
sleep_score: 81
sleep_duration: 7h 43min
hrv: 39
stress: 30
workout_location: Bad Honnef, Deutschland
---
```

### アクティビティ

各ワークアウトはサマリー文字列を持つ frontmatter キーとして記録されます：

```yaml
---
hiking: 8.2 km · 157min · Ø105 bpm · 696 kcal
e_bike: 22.1 km · 65min · Ø112 bpm · 420 kcal
---
```

実際にワークアウトがあった日のみアクティビティキーが追加されます。プラグインはノートの既存コンテンツを上書きしません。

### トレーニング（オプション、機械可読）

設定で「機械可読トレーニング」を有効にすると、Dataview クエリ用の構造化 `trainings` フィールドが追加されます：

```yaml
---
trainings:
  - type: hiking
    category: outdoor
    distance_km: 8.2
    duration_min: 157
    avg_hr: 105
    calories: 696
  - type: e_bike
    category: cycling
    distance_km: 22.1
    duration_min: 65
    avg_hr: 112
    calories: 420
---
```

## インストール

### Community Plugins から（推奨）

1. Obsidian 設定 → Community Plugins → ブラウズ を開く
2. "Health Sync" を検索
3. プラグインをインストールして有効化
4. プラグイン設定で Garmin Connect にログイン

### 手動インストール

1. [最新リリース](https://github.com/fcandi/obsidian-health-sync/releases)から `main.js` と `manifest.json` をダウンロード
2. Vault 内に `.obsidian/plugins/obsidian-health-sync/` フォルダを作成
3. 両方のファイルをそのフォルダにコピー
4. 設定 → Community Plugins でプラグインを有効化

## アクティビティキーの正規化

プロバイダー固有のアクティビティ名は正規キーに変換されます。Garmin の `typeKey` 値を基準とし、冗長なキーには若干の整理が行われています：

| プロバイダーキー | 正規キー | カテゴリ |
|---|---|---|
| `e_bike_fitness` | `e_bike` | cycling |
| `e_bike_mountain` | `e_mtb` | cycling |
| `resort_skiing_snowboarding` | `skiing` | winter |
| `backcountry_skiing_snowboarding` | `backcountry_skiing` | winter |
| `stand_up_paddleboarding` | `sup` | water |
| `fitness_equipment` | `gym_equipment` | gym |

その他の Garmin キーはそのまま使用されます（例：`hiking`、`running`、`cycling`、`swimming`、`strength_training`、`yoga` など）。

### アクティビティカテゴリ

各アクティビティにはプロバイダー間の互換性のためにカテゴリが割り当てられます：

| カテゴリ | 例 |
|---|---|
| `cycling` | cycling, e_bike, e_mtb, mountain_biking, indoor_cycling, road_biking |
| `running` | running, trail_running, treadmill, ultra_run |
| `walking` | walking, indoor_walking |
| `outdoor` | hiking, mountaineering, rock_climbing, bouldering |
| `swimming` | swimming, pool_swimming, open_water_swimming |
| `winter` | skiing, backcountry_skiing, cross_country_skiing, snowboarding |
| `water` | sup, rowing, kayaking, surfing, sailing |
| `gym` | strength_training, gym_equipment, elliptical, yoga, pilates, hiit |
| `racket` | tennis, badminton, squash, table_tennis, pickleball |
| `team` | soccer, basketball, volleyball, rugby |
| `other` | golf, meditation, multi_sport |

今後のプロバイダー（Fitbit、Oura など）も同じ正規キーにマッピングされます。

## 開発

```bash
npm install
npm run dev    # ウォッチモード
npm run build  # プロダクションビルド
```
