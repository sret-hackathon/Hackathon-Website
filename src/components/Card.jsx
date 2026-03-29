const Card = ({ children, className = '', hover = false, style={} }) => {
  const hoverClass = hover ? 'card-hover' : '';
  return (
    <div className={`white-panel ${hoverClass} ${className}`} style={style}>
      {children}
    </div>
  );
};

export default Card;
