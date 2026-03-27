import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/core/i18n/i18n.ts")

const parseAllowedOrigins = (value: string | undefined): Array<string> =>
  value
    ? value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []

const allowedDevOrigins = parseAllowedOrigins(
  process.env["SPAWNDOCK_ALLOWED_DEV_ORIGINS"]
)
const previewPath = process.env["SPAWNDOCK_PREVIEW_PATH"]
const serverActionOrigins = parseAllowedOrigins(
  process.env["SPAWNDOCK_SERVER_ACTIONS_ALLOWED_ORIGINS"]
)
const normalizedPreviewPath =
  previewPath && previewPath.length > 0 ? previewPath : undefined
const githubPagesExport = process.env["SPAWNDOCK_GITHUB_PAGES_EXPORT"] === "1"
const previewConfig = normalizedPreviewPath
  ? {
      assetPrefix: normalizedPreviewPath,
      basePath: normalizedPreviewPath
    }
  : {}
const exportConfig = githubPagesExport
  ? {
      images: { unoptimized: true },
      output: "export" as const
    }
  : {
      experimental: {
        serverActions: {
          allowedOrigins: serverActionOrigins
        }
      }
    }

const nextConfig: NextConfig = {
  allowedDevOrigins,
  trailingSlash: githubPagesExport,
  ...previewConfig,
  ...exportConfig
}

export default withNextIntl(nextConfig)
