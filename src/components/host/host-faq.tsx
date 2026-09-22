import { getHostFaqs } from "@/lib/data/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export async function HostFaq() {
  const FAQS = await getHostFaqs();

  return (
    <Accordion type="single" collapsible className="mx-auto max-w-3xl">
      {FAQS.map((faq, i) => (
        <AccordionItem key={faq.q} value={`faq-${i}`}>
          <AccordionTrigger>{faq.q}</AccordionTrigger>
          <AccordionContent>{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
