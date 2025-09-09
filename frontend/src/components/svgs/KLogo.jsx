const KLogo = ({ className = "", ...props }) => (
	<img 
		src="/K-logo.png" 
		alt="K Social Logo" 
		className={`${className}`}
		{...props}
	/>
);

export default KLogo;
