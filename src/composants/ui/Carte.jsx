export default function Card({ children, className = '', as: Tag = 'div', padded = true, ...rest }) {
  return (
    <Tag className={`card ${padded ? 'card--padded' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
