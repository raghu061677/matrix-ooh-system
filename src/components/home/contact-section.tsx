import { ContactForm } from './contact-form';

export function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Let's Build Your Next Campaign</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Have a question or ready to get started? Fill out the form, and our team will get back to you shortly.
            </p>
            <p className="mt-4 text-muted-foreground">
              For a personalized recommendation, describe your campaign goals in the "Requirements" field, and our AI will suggest the perfect locations for you.
            </p>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
