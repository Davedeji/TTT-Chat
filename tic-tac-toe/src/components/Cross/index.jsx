import "./index.css"

const Cross = () => {
    return (
        <svg 
            width="100" 
            height="100" 
            viewBox="-50 -50 100 100" 
            className="cross">
          <line x1="-40" y1="-40" x2="40" y2="40" />
          <line x1="-40" y1="40" x2="40" y2="-40" />
        </svg>
      );
};

export default Cross 