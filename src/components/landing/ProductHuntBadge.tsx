export const ProductHuntBadge = () => {
  return (
    <a 
      href="https://www.producthunt.com/products/quizabl?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-quizabl" 
      target="_blank"
      rel="noopener noreferrer"
      className="animate-fade-in hover:scale-105 transition-transform"
      style={{ animationDelay: "0.1s" }}
    >
      <img 
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1032632&theme=light&t=1761835541301" 
        alt="Quizabl - Create lessons into interactive quizzess in seconds | Product Hunt" 
        className="w-[200px] h-auto md:w-[250px]"
        width="250" 
        height="54" 
      />
    </a>
  );
};
