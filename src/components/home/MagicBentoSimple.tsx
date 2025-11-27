import { useRef, useState } from 'react';
import './MagicBento.css';

const cardData = [
  {
    color: 'transparent',
    title: 'Signature Style',
    description: 'Zuve AI Studio learns your brand\'s design language and remembers it',
    label: 'AI'
  },
  {
    color: 'transparent',
    title: 'Motif Library',
    description: 'Find all your motifs and elements in one place',
    label: 'Library'
  },
  {
    color: 'transparent',
    title: 'Content Builder',
    description: 'Describes your jewellery designs in one click, while maintaining the tone of your brand',
    label: 'Design'
  },
  {
    color: 'transparent',
    title: 'Instant 360 Video',
    description: 'Create high quality videos to share with your clients',
    label: 'Video'
  },
  {
    color: 'transparent',
    title: 'Auto Job Cards',
    description: 'Creates a job card in one click for your production team',
    label: 'Production'
  },
  {
    color: 'transparent',
    title: 'Stone Layout Assistant',
    description: 'Smart placement guidance',
    label: 'Assistant'
  },
  {
    color: 'transparent',
    title: 'Inspiration Gallery',
    description: 'Browse through 1000s of jewellery designs augmented by AI',
    label: 'Gallery'
  },
  {
    color: 'transparent',
    title: 'Intelligent Presentation',
    description: 'Export your designs as professional presentations instantly',
    label: 'Export'
  },
  {
    color: 'transparent',
    title: 'Collection Analysis',
    description: 'Analyze your collection performance and trends',
    label: 'Analytics'
  },
  {
    color: 'transparent',
    title: 'Design 10x Faster',
    description: 'Transform your jewelry design process with AI-powered tools',
    label: 'Speed'
  }
];

const MagicBentoSimple = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="card-grid bento-section">
      {cardData.map((card, index) => (
        <div
          key={index}
          className="card card--text-autohide"
          style={{
            background: card.color,
            transform: hoveredCard === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: hoveredCard === index
              ? '0 20px 40px rgba(0,0,0,0.3)'
              : '0 8px 25px rgba(0,0,0,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={() => setHoveredCard(index)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* 360 Video for Instant 360 Video card */}
          {card.title === 'Instant 360 Video' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <video
                width="100%"
                height="100%"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              >
                <source src="/360.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Content image for Content Builder card */}
          {card.title === 'Content Builder' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Content_Builder.jpg"
                alt="Content Builder"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          )}

          {/* Motif Library image */}
          {card.title === 'Motif Library' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Motif_Library.jpg"
                alt="Motif Library"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                  objectPosition: 'center 75%'
                }}
              />
            </div>
          )}

          {/* Intelligent Presentation image */}
          {card.title === 'Intelligent Presentation' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Intelligent_Presentation.jpg"
                alt="Intelligent Presentation"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                  objectPosition: 'center 0%'
                }}
              />
            </div>
          )}

          {/* Auto Job Cards image */}
          {card.title === 'Auto Job Cards' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Manufacturing_Job_Card.jpg"
                alt="Auto Job Cards"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                  objectPosition: 'center 0%'
                }}
              />
            </div>
          )}

          {/* Stone Layout Assistant image */}
          {card.title === 'Stone Layout Assistant' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Stone_Layout_Assistant.jpg"
                alt="Stone Layout Assistant"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          )}

          {/* Signature Style image */}
          {card.title === 'Signature Style' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Brand_Signature_Style.jpg"
                alt="Signature Style"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                  objectPosition: 'center 70%'
                }}
              />
            </div>
          )}

          {/* Inspiration Gallery image */}
          {card.title === 'Inspiration Gallery' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Jewellery_Inspiration_Gallery.jpg"
                alt="Inspiration Gallery"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                  objectPosition: 'center 90%'
                }}
              />
            </div>
          )}

          {/* Collection Analysis image */}
          {card.title === 'Collection Analysis' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_jewelley_collection_analysis.jpg"
                alt="Collection Analysis"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          )}

          {/* Design 10x Faster image */}
          {card.title === 'Design 10x Faster' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              opacity: hoveredCard === index ? 1.0 : 0.8,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}>
              <img
                src="/Zuve_Studio_Design_Jewellery_10x_faster.jpg"
                alt="Design 10x Faster"
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          )}
          
        </div>
      ))}
    </div>
  );
};

export default MagicBentoSimple;
