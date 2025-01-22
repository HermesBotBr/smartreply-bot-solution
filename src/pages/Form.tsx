import ContactForm from "@/components/ContactForm";

const Form = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary to-secondary p-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-xl p-8">
        <ContactForm />
      </div>
    </div>
  );
};

export default Form;