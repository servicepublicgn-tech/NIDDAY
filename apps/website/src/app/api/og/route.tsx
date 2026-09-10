import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const contentType = "image/png";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "NIDDAY";
  const description = searchParams.get("description") ?? "";

  return new ImageResponse(
    <div tw="h-full w-full flex flex-col bg-[#0C0C0C] p-16">
      <div tw="flex items-center text-[#D5A323] text-3xl">NIDDAY</div>

      <div tw="flex flex-col flex-1 items-center justify-center">
        <span tw="text-white text-7xl text-center leading-tight max-w-[1000px]">
          {title}
        </span>
        {description && (
          <span tw="text-[#878787] text-3xl text-center mt-6 max-w-[800px]">
            {description}
          </span>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
