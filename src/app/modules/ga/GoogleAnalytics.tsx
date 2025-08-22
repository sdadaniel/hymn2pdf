import Script from "next/script";

export default function GoogleAnalytics() {
  const isDebug = process.env.NEXT_PUBLIC_IS_GA_DEBUG === 'true';
  
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // GA 설정 - 디버그 모드 지원
          gtag('config', '${process.env.NEXT_PUBLIC_GA_TRACKING_ID}', {
            debug_mode: ${isDebug},
            ${isDebug ? 'send_page_view: false,' : ''}
            ${isDebug ? 'anonymize_ip: true,' : ''}
          });
        `}
      </Script>
      
      {/* Google Tag Manager */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
          
          // GTM 디버그 모드 설정
          ${isDebug ? `
          console.log('Google Tag Manager Debug Mode Enabled');
          console.log('GTM ID:', '${process.env.NEXT_PUBLIC_GTM_ID}');
          ` : ''}
        `}
      </Script>
    </>
  );
}
