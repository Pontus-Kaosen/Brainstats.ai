type Props = {
    children: React.ReactNode;
    className?: string;
  };
  
  export default function BrainCard({ children, className = "" }: Props) {
    return (
      <div
        className={`
          brain-card
          rounded-3xl
          p-8
          transition-all
          duration-300
          hover:-translate-y-1
          ${className}
        `}
      >
        {children}
      </div>
    );
  }