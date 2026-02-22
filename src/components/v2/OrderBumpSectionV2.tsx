import { useState } from "react";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// ✅ order bump images
import jewelleryBoxImg from "@/assets/jewellerybox.png";
import travelBagImg from "@/assets/travel makeup bag.png";

const OrderBumpSectionV2 = () => {
  const [makeupBag, setMakeupBag] = useState(false);
  const [jewelleryBox, setJewelleryBox] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: products } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: () => fetchProducts(10),
  });

  const findProduct = (handle: string): ShopifyProduct | undefined =>
    products?.find((p) => p.node.handle === handle);

  const basePrice = 799;
  const total = basePrice + (makeupBag ? 299 : 0) + (jewelleryBox ? 199 : 0);

  const openCheckout = (url: string) => {
    // Mobile/in-app browsers often block window.open after async work.
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ((navigator as any).maxTouchPoints && (navigator as any).maxTouchPoints > 1);

    if (isMobile) {
      // ✅ most reliable on mobile
      window.location.assign(url);
      return;
    }

    // ✅ desktop: try new tab, fallback to same tab if blocked
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
  };

  const handleCheckout = async () => {
    if (isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      clearCart();

      const guideProduct = findProduct("thrivebeautylabs-expert-guide-system");
      const makeupBagProduct = findProduct("makeup-travel-bag");
      const jewelleryBoxProduct = findProduct("jewellery-box");

      if (!guideProduct) {
        toast.error("Products not loaded yet. Please try again.");
        return;
      }

      const guideVariant = guideProduct.node.variants.edges[0]?.node;
      if (!guideVariant) {
        toast.error("Product variant not found. Please try again.");
        return;
      }

      await addItem({
        product: guideProduct,
        variantId: guideVariant.id,
        variantTitle: guideVariant.title,
        price: guideVariant.price,
        quantity: 1,
        selectedOptions: guideVariant.selectedOptions || [],
      });

      if (jewelleryBox && jewelleryBoxProduct) {
        const variant = jewelleryBoxProduct.node.variants.edges[0]?.node;
        if (variant) {
          await addItem({
            product: jewelleryBoxProduct,
            variantId: variant.id,
            variantTitle: variant.title,
            price: variant.price,
            quantity: 1,
            selectedOptions: variant.selectedOptions || [],
          });
        }
      }

      if (makeupBag && makeupBagProduct) {
        const variant = makeupBagProduct.node.variants.edges[0]?.node;
        if (variant) {
          await addItem({
            product: makeupBagProduct,
            variantId: variant.id,
            variantTitle: variant.title,
            price: variant.price,
            quantity: 1,
            selectedOptions: variant.selectedOptions || [],
          });
        }
      }

      const checkoutUrl = useCartStore.getState().getCheckoutUrl();
      if (!checkoutUrl) {
        toast.error("Failed to create checkout. Please try again.");
        return;
      }

      openCheckout(checkoutUrl);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      // If we redirected successfully, this won't matter (page unloads).
      // If popup was blocked / error occurred, UI resets.
      setIsCheckingOut(false);
    }
  };

  return (
    <section id="final-cta" className="bg-background py-6">
      {/* ✅ very less side padding + mobile-first width */}
      <div className="mx-auto w-full max-w-md px-3">
        <div className="border-2 border-gold/70 rounded-3xl bg-white shadow-xl">
          <motion.div
            className="px-4 py-5 sm:px-6 sm:py-6"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* ✅ HEADLINE forced 2 lines, end-to-end */}
            <h2 className="font-heading text-[30px] leading-[1.05] tracking-tight text-center">
              <span className="block whitespace-nowrap">The ThriveBeautyLabs</span>
              <span className="block whitespace-nowrap">Expert Guide System</span>
            </h2>

            <p className="eyebrow text-center mt-2 mb-4">Made for Indian Skin Tones</p>

            {/* ✅ tighter feature list */}
            <ul className="space-y-2.5 text-left">
              {[
                "True Tone Guide (70+ pages of shade mastery)",
                "Jetsetter Beauty Guide (50+ pages of travel expertise)",
                "Exclusive Bonus Resources",
                "Lifetime Access + Free Updates Forever",
                "30-Day Money-Back Guarantee",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 font-body text-[15px] leading-snug">
                  <Check size={18} className="text-success flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* ✅ compact price block */}
            <div className="mt-5 text-center">
              <p className="font-heading text-lg text-muted-foreground line-through">₹2,999</p>
              <p className="font-heading text-5xl font-bold text-gradient-gold leading-none mt-1">
                ₹{total}
              </p>
              <div className="inline-block mt-2 bg-destructive/10 text-destructive font-label font-semibold text-xs px-3 py-1.5 rounded-full">
                YOU SAVE: ₹{2999 - total} (73% OFF)
              </div>
            </div>

            {/* ✅ compact order bumps + images */}
            <div className="mt-5 space-y-2.5">
              <p className="font-label text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Add to your order
              </p>

              <label
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  jewelleryBox ? "border-gold bg-gold/5" : "border-border bg-card"
                }`}
              >
                <Checkbox checked={jewelleryBox} onCheckedChange={(v) => setJewelleryBox(!!v)} />
                <img
                  src={jewelleryBoxImg}
                  alt="Jewellery box"
                  className="h-12 w-12 rounded-xl object-cover border border-border/60"
                />
                <div className="text-left flex-1">
                  <p className="font-body font-semibold leading-tight">Jewellery Box</p>
                  <p className="font-body text-xs text-muted-foreground leading-snug">
                    Premium travel jewellery organizer
                  </p>
                </div>
                <span className="font-label font-bold text-gold-dark text-sm">+ ₹199</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  makeupBag ? "border-gold bg-gold/5" : "border-border bg-card"
                }`}
              >
                <Checkbox checked={makeupBag} onCheckedChange={(v) => setMakeupBag(!!v)} />
                <img
                  src={travelBagImg}
                  alt="Makeup travel bag"
                  className="h-12 w-12 rounded-xl object-cover border border-border/60"
                />
                <div className="text-left flex-1">
                  <p className="font-body font-semibold leading-tight">Makeup Travel Bag</p>
                  <p className="font-body text-xs text-muted-foreground leading-snug">
                    Spacious beauty essentials pouch
                  </p>
                </div>
                <span className="font-label font-bold text-gold-dark text-sm">+ ₹299</span>
              </label>
            </div>

            {/* ✅ slimmer, premium CTA */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="mt-5 w-full rounded-full border border-gold/60 bg-gradient-to-b from-gold to-gold-dark text-white font-label tracking-wide
                         py-4 px-6 text-base inline-flex items-center justify-center gap-2
                         shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  GET INSTANT ACCESS — ₹{total}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* ✅ tighter trust row */}
            <div className="mt-4 flex justify-center gap-5 text-xs font-label text-muted-foreground">
              <span className="flex items-center gap-1.5">🔒 Secure Checkout</span>
              <span className="flex items-center gap-1.5">📥 Instant Download</span>
            </div>

            {/* ✅ compact reassurance copy */}
            <div className="mt-6 text-center">
              <p className="font-body text-muted-foreground italic text-sm mb-2">Still thinking about it?</p>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                Every day without these guides is another day of buying the wrong foundation shade,
                wasting hours packing, and missing out on looking your absolute best.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default OrderBumpSectionV2;