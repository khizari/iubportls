'use client';

import Script from 'next/script';

// Loads the original template's jQuery + plugin scripts, in the same order
// as the static site's index.html, so all existing interactivity (mobile
// menu, sliders, cart panel, quick search, tooltips, smooth scroll, etc.)
// keeps working unmodified. `afterInteractive` scripts run client-side in
// the order they're declared, once the page has hydrated.
export default function SiteScripts() {
  return (
    <>
      <Script src="/vendor/jquery/jquery-3.2.1.min.js" strategy="afterInteractive" />
      <Script src="/vendor/animsition/js/animsition.min.js" strategy="afterInteractive" />
      <Script src="/vendor/bootstrap/js/popper.js" strategy="afterInteractive" />
      <Script src="/vendor/bootstrap/js/bootstrap.min.js" strategy="afterInteractive" />
      <Script src="/vendor/select2/select2.min.js" strategy="afterInteractive" />
      <Script src="/vendor/daterangepicker/moment.min.js" strategy="afterInteractive" />
      <Script src="/vendor/daterangepicker/daterangepicker.js" strategy="afterInteractive" />
      <Script src="/vendor/slick/slick.min.js" strategy="afterInteractive" />
      <Script src="/legacy-js/slick-custom.js" strategy="afterInteractive" />
      <Script src="/vendor/parallax100/parallax100.js" strategy="afterInteractive" />
      <Script src="/vendor/MagnificPopup/jquery.magnific-popup.min.js" strategy="afterInteractive" />
      <Script src="/vendor/isotope/isotope.pkgd.min.js" strategy="afterInteractive" />
      <Script src="/vendor/sweetalert/sweetalert.min.js" strategy="afterInteractive" />
      <Script src="/legacy-js/interactions.js" strategy="afterInteractive" />
      <Script src="/vendor/perfect-scrollbar/perfect-scrollbar.min.js" strategy="afterInteractive" />
      <Script src="/legacy-js/main.js" strategy="afterInteractive" />
    </>
  );
}
