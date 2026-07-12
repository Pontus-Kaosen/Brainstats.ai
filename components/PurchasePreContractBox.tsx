"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { getSellerBlock } from "@/lib/companyInfo";

export default function PurchasePreContractBox() {
  const { language, t } = useLanguage();

  const items = [
    {
      label: t.premium.prePurchase.sellerLabel,
      value: getSellerBlock(language),
    },
    {
      label: t.premium.prePurchase.paymentLabel,
      value: t.premium.prePurchase.paymentText,
    },
    {
      label: t.premium.prePurchase.deliveryLabel,
      value: t.premium.prePurchase.deliveryText,
    },
    {
      label: t.premium.prePurchase.withdrawalLabel,
      value: t.premium.prePurchase.withdrawalText,
    },
    {
      label: t.premium.prePurchase.cancelLabel,
      value: t.premium.prePurchase.cancelText,
    },
  ];

  return (
    <section className="rounded-[2rem] border border-[#18ff6d33] bg-[#07140d]/70 p-6 sm:p-8">
      <h2 className="text-2xl font-black text-white">
        {t.premium.prePurchase.title}
      </h2>

      <p className="mt-3 leading-7 text-[#A9A9A9]">
        {t.premium.prePurchase.intro}
      </p>

      <div className="mt-6 space-y-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-black/30 p-4"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#18ff6d]">
              {item.label}
            </p>

            <p className="mt-2 whitespace-pre-line leading-7 text-[#D8D8D8]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
