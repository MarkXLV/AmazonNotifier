import logging
from email.message import EmailMessage

import aiosmtplib

from ..config import settings

logger = logging.getLogger(__name__)


def _build_price_drop_email(
    product_name: str,
    old_price: float,
    new_price: float,
    url: str,
    target_reached: bool = False,
) -> str:
    savings = old_price - new_price
    pct = round((savings / old_price) * 100)

    subject_tag = "TARGET PRICE REACHED" if target_reached else "Price Drop Alert"

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #6366f1; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 18px;">
          PriceWatch
        </div>
      </div>

      <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="background: {'#059669' if target_reached else '#10b981'}; color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
          {subject_tag}
        </div>

        <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b; line-height: 1.4;">
          {product_name}
        </h2>

        <div style="display: flex; gap: 16px; align-items: baseline; margin-bottom: 16px;">
          <span style="font-size: 28px; font-weight: 800; color: #1e293b;">₹{new_price:,.0f}</span>
          <span style="font-size: 16px; color: #94a3b8; text-decoration: line-through;">₹{old_price:,.0f}</span>
          <span style="background: #d1fae5; color: #059669; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">
            -{pct}% (₹{savings:,.0f})
          </span>
        </div>

        <a href="{url}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View on Amazon &rarr;
        </a>
      </div>

      <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
        You are receiving this because you enabled price alerts on PriceWatch.
      </p>
    </div>
    """


async def send_price_drop_email(
    to_email: str,
    product_name: str,
    old_price: float,
    new_price: float,
    product_url: str,
    target_reached: bool = False,
) -> bool:
    if not settings.email_enabled or not to_email:
        return False

    try:
        msg = EmailMessage()
        tag = "Target reached!" if target_reached else "Price dropped!"
        msg["Subject"] = f"[PriceWatch] {tag} {product_name[:60]}"
        msg["From"] = settings.email_from or settings.smtp_user
        msg["To"] = to_email

        html = _build_price_drop_email(
            product_name, old_price, new_price, product_url, target_reached
        )
        msg.set_content(f"Price drop! {product_name}: ₹{old_price:,.0f} → ₹{new_price:,.0f}")
        msg.add_alternative(html, subtype="html")

        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=False,
            start_tls=True,
        )
        logger.info("Email sent to %s for %s", to_email, product_name)
        return True

    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False
