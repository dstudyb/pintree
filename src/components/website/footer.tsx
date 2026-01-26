import { useSettings } from "@/hooks/use-settings";
import Link from "next/link";

export function Footer() {
  const { settings } = useSettings('basic');

  const socialLinks = [
    {
      key: 'githubUrl',
      icon: 'ri-github-fill',
      label: 'GitHub'
    },
    {
      key: 'twitterUrl',
      icon: 'ri-twitter-x-fill',
      label: 'Twitter'
    }
  ];

  return (
    // ================= 修改点: 背景改为半透明毛玻璃，边框柔化 =================
    <footer className="w-full border-t border-border/40 bg-background/60 backdrop-blur-md">
    {/* ========================================================================= */}
      <div className="mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          {/* 左侧版权信息 */}
          {(
            <div className="text-sm text-muted-foreground order-first lg:order-none flex items-center gap-1">
              <img src="/logo.svg" alt="Pintree Logo" className="h-4 w-4" />
              Powered by{' '}
              <Link
                href="https://pintree.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/90 transition-colors"
              >
                Pintree
              </Link>
            </div>
          )}

          {/* 中间 Powered by 信息 */}
          <div className="text-sm text-muted-foreground text-center lg:text-left">
            <span>{settings.copyrightText}</span>
          </div>

          {/* 右侧社交媒体链接 */}
          <div className="flex items-center space-x-4">
            {socialLinks.map(({ key, icon, label }) => 
              (key === 'contactEmail' ? settings[key] : settings[key]) && (
                <Link
                  key={key}
                  href={key === 'contactEmail' ? `mailto:${settings[key]}` : settings[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={label}
                >
                  <i className={`${icon} h-5 w-5`} />
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
