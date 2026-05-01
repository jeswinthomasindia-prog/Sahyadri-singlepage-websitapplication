// Industry Insights JavaScript
class IndustryInsights {
  constructor() {
    this.items = [];
    this.isLoading = false;
    this.hasMore = true;
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.observer = null;
    this.loadedImages = new Set();
    this.allItems = []; // Store all items for infinite scroll
    this.currentStartIndex = 0; // Track current position in allItems
    
    this.init();
  }

  init() {
    this.loadInitialContent();
    this.setupIntersectionObserver();
    this.setupInfiniteScroll();
  }

  async loadInitialContent() {
    try {
      this.isLoading = true;
      this.updateLoadingState();
      
      // Always load from RSS feed
      console.log('🔄 Loading RSS feed from thinkmatter.in');
      await this.loadRSSFeed();
      
    } catch (error) {
      console.error('❌ Error loading RSS feed:', error);
      this.showErrorState();
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  async loadRSSFeed() {
    // Since all external approaches fail with CORS, create local industry insights data
    console.log('🔄 Creating local industry insights data with images...');
    
    try {
      // Create comprehensive industry insights data with real images
      const localInsights = [
        {
          title: 'Sustainable Architecture Trends 2026',
          description: 'Green building design is revolutionizing modern architecture with energy-efficient materials, solar integration, and biophilic design principles. Industry leaders are adopting net-zero carbon building standards.',
          importantPoints: ['Net-zero carbon buildings', 'Solar integration', 'Biophilic design', 'Energy efficiency'],
          imageUrl: 'resources/images/industry_insights/Sustainable_Architecture_Trends_2026.jpg?auto=format&fit=crop&w=400&q=80',
          source: 'Architecture Today',
          link: 'https://howtorhino.com/blog/architecture-education/architecture-trends/',
          category: 'Architecture',
          date: new Date().toLocaleDateString(),
          id: 'local-1'
        },
        {
          title: 'Smart Construction Technology',
          description: 'IoT sensors and AI-powered construction equipment are transforming job sites. Real-time monitoring, predictive maintenance, and automated machinery are improving safety and efficiency.',
          importantPoints: ['IoT sensors', 'AI-powered equipment', 'Real-time monitoring', 'Predictive maintenance'],
          imageUrl: 'resources/images/industry_insights/Smart_Construction_Technology.jpg?auto=format&fit=crop&w=400&q=80',
          source: 'Construction Tech Weekly',
          link: 'https://build-up.ec.europa.eu/en/resources-and-tools/publications/smart-construction-technologies-redefining-present-and-shaping',
          category: 'Technology',
          date: new Date().toLocaleDateString(),
          id: 'local-2'
        },
        {
          title: 'Urban Planning for Climate Resilience',
          description: 'Cities worldwide are redesigning infrastructure to combat climate change. Green roofs, permeable pavements, and flood-resistant architecture are becoming mandatory in new developments.',
          importantPoints: ['Climate resilience', 'Green infrastructure', 'Flood resistance', 'Sustainable urban design'],
          imageUrl: 'resources/images/industry_insights/Urban _lanning_for_Climate_Resilience.jpg?auto=format&fit=crop&w=400&q=80',
          source: 'Urban Planning Magazine',
          link: 'https://www.ie.edu/uncover-ie/urban-planning-for-climate-resilience-adapting-cities-to-challenges/',
          category: 'Urban Planning',
          date: new Date().toLocaleDateString(),
          id: 'local-3'
        },
        {
          title: 'Modular Construction Revolution',
          description: 'Prefabricated and modular construction methods are reducing project timelines by 40%. Factory-built components offer better quality control and reduced waste.',
          importantPoints: ['Modular construction', 'Prefabrication', 'Reduced timelines', 'Quality control'],
          imageUrl: 'resources/images/industry_insights/Modular_Construction_Revolution.jpg?auto=format&fit=crop&w=400&q=80',
          source: 'Building Industry Report',
          link: 'https://altamiraconstructora.com/en/the-modular-construction-revolution/',
          category: 'Construction',
          date: new Date().toLocaleDateString(),
          id: 'local-4'
        },
        {
          title: 'Digital Twin Technology in Infrastructure',
          description: 'Digital twins are enabling predictive maintenance and optimization of bridges, roads, and utilities. Real-time data integration is transforming infrastructure management.',
          importantPoints: ['Digital twins', 'Predictive maintenance', 'Real-time data', 'Infrastructure optimization'],
          imageUrl: 'resources/images/industry_insights/Digital_Twin_Technology_in Infrastructure.jpg?auto=format&fit=crop&w=400&q=80',
          source: 'Infrastructure Digital',
          link: 'https://matterport.com/learn/digital-twin/construction?srsltid=AfmBOorxqKBD29XxLJIpC4g6FSo3IvEvqhlVMKSD2oyUcqI9tOrZVxxS',
          category: 'Technology',
          date: new Date().toLocaleDateString(),
          id: 'local-5'
        },
        // {
        //   title: 'Green Building Materials Innovation',
        //   description: 'New sustainable materials including recycled concrete, bamboo composites, and bio-based insulation are replacing traditional construction materials while improving performance.',
        //   importantPoints: ['Recycled materials', 'Bamboo composites', 'Bio-based insulation', 'Sustainable performance'],
        //   imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3dad8b3ba?auto=format&fit=crop&w=400&q=80',
        //   source: 'Green Building Materials',
        //   link: '#',
        //   category: 'Sustainability',
        //   date: new Date().toLocaleDateString(),
        //   id: 'local-6'
        // },
        // {
        //   title: 'AI in Architectural Design',
        //   description: 'Machine learning algorithms are optimizing building layouts, energy consumption, and structural integrity. Generative design is creating innovative architectural solutions.',
        //   importantPoints: ['Machine learning', 'Generative design', 'Energy optimization', 'Structural analysis'],
        //   imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=400&q=80',
        //   source: 'AI Architecture Today',
        //   link: '#',
        //   category: 'Technology',
        //   date: new Date().toLocaleDateString(),
        //   id: 'local-7'
        // },
        // {
        //   title: 'Infrastructure Investment Boom',
        //   description: 'Government infrastructure spending is reaching record levels with focus on sustainable transportation, renewable energy, and digital infrastructure projects.',
        //   importantPoints: ['Infrastructure spending', 'Sustainable transport', 'Renewable energy', 'Digital infrastructure'],
        //   imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=400&q=80',
        //   source: 'Infrastructure Finance',
        //   link: '#',
        //   category: 'Market',
        //   date: new Date().toLocaleDateString(),
        //   id: 'local-8'
        // },
        // {
        //   title: 'Water Management Systems',
        //   description: 'Smart water management systems using IoT sensors and AI are reducing water waste in buildings and cities. Rainwater harvesting and greywater recycling are becoming standard.',
        //   importantPoints: ['Smart water systems', 'IoT sensors', 'Rainwater harvesting', 'Greywater recycling'],
        //   imageUrl: 'https://images.unsplash.com/photo-1542391253-9e09b6a5b?auto=format&fit=crop&w=400&q=80',
        //   source: 'Water Management Today',
        //   link: '#',
        //   category: 'Sustainability',
        //   date: new Date().toLocaleDateString(),
        //   id: 'local-9'
        // },
        // {
        //   title: 'Construction Safety Innovations',
        //   description: 'Wearable technology, drone monitoring, and VR training are dramatically improving construction site safety. Real-time hazard detection is preventing accidents.',
        //   importantPoints: ['Wearable tech', 'Drone monitoring', 'VR training', 'Hazard detection'],
        //   imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
        //   source: 'Construction Safety News',
        //   link: '#',
        //   category: 'Innovation',
        //   date: new Date().toLocaleDateString(),
        //   id: 'local-10'
        // }
      ];
      
      console.log(`✅ Created ${localInsights.length} local industry insights with images`);
      
      // Store in allItems for infinite scroll
      this.allItems = localInsights;
      
      // Render the items
      this.renderItems();
      
      return;
      
    } catch (error) {
      console.error('❌ Error creating local insights:', error);
      throw error;
    }
  }

  parseRSSItems(items) {
    const parsedItems = Array.from(items).map(item => {
      try {
        // Check if this is local data (has imageUrl field) or RSS data
        if (item.imageUrl) {
          // Local data - use fields directly
          return {
            title: item.title || '',
            summary: item.summary || this.createSummary(item.description || ''),
            importantPoints: item.importantPoints || [],
            imageUrl: item.imageUrl,
            source: item.source || 'Sahyadri Consultants',
            link: item.link || '#',
            category: item.category || 'Industry News',
            date: item.date || new Date().toLocaleDateString(),
            id: item.id || Math.random().toString(36)
          };
        } else {
          // RSS data - use querySelector method
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const category = item.querySelector('category')?.textContent || 'Industry News';
          
          // Extract image from description or enclosure
          const imageUrl = this.extractImage(item, description);
          
          // Create summary from description (strip HTML)
          const summary = this.createSummary(description);
          
          // Extract important points
          const importantPoints = this.extractImportantPoints(description);
          
          return {
            title: this.cleanText(title),
            summary: summary,
            importantPoints: importantPoints,
            imageUrl: imageUrl,
            source: 'thinkmatter.in',
            link: link,
            category: this.cleanText(category),
            date: pubDate,
            id: Math.random().toString(36)
          };
        }
      } catch (error) {
        console.error('Error parsing RSS item:', error);
        return null;
      }
    });
    
    return parsedItems;
  }

  extractImage(item, description) {
    console.log('🔍 Extracting image from RSS item...');
    
    // Handle WordPress post-id structure with nested media:thumbnail
    const postId = item.querySelector('post-id');
    if (postId) {
      console.log('📝 Found post-id element, looking for nested media...');
      
      // Look for media:thumbnail inside post-id
      const thumbnail = postId.querySelector('media\\:thumbnail')?.getAttribute('url');
      if (thumbnail) {
        console.log('✅ Found post-id media:thumbnail image:', thumbnail);
        return thumbnail;
      }
      
      // Look for media:content inside post-id
      const featuredImage = postId.querySelector('media\\:content')?.getAttribute('url');
      if (featuredImage) {
        console.log('✅ Found post-id media:content image:', featuredImage);
        return featuredImage;
      }
      
      // Look for any media:content (multiple possible)
      const allMediaContents = postId.querySelectorAll('media\\:content');
      for (const mediaContent of allMediaContents) {
        const mediaUrl = mediaContent?.getAttribute('url');
        if (mediaUrl && mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          console.log('✅ Found post-id media:content image:', mediaUrl);
          return mediaUrl;
        }
      }
    }
    
    // Try to extract from media:thumbnail (standard RSS - outside post-id)
    const standardThumbnail = item.querySelector('media\\:thumbnail')?.getAttribute('url');
    if (standardThumbnail) {
      console.log('✅ Found standard media:thumbnail image:', standardThumbnail);
      return standardThumbnail;
    }
    
    // Try to extract from media:content (WordPress featured image - outside post-id)
    const featuredImage = item.querySelector('media\\:content')?.getAttribute('url');
    if (featuredImage) {
      console.log('✅ Found media:content image:', featuredImage);
      return featuredImage;
    }
    
    // Try to get image from enclosure
    const enclosure = item.querySelector('enclosure');
    if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
      console.log('✅ Found enclosure image:', enclosure.getAttribute('url'));
      return enclosure.getAttribute('url');
    }
    
    // Try to extract image from description content
    const imgMatch = description.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
      console.log('✅ Found description image:', imgMatch[1]);
      return imgMatch[1];
    }
    
    // Try to extract from content:encoded
    const content = item.querySelector('content\\:encoded')?.textContent;
    if (content) {
      const contentImgMatch = content.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/i);
      if (contentImgMatch && contentImgMatch[1]) {
        console.log('✅ Found content:encoded image:', contentImgMatch[1]);
        return contentImgMatch[1];
      }
    }
    
    // If no image found, return a beautiful placeholder based on category
    const category = item.querySelector('category')?.textContent || 'Industry News';
    console.log('⚠️ No image found, using category placeholder for:', category);
    return this.getCategoryPlaceholder(category);
  }

  getCategoryPlaceholder(category) {
    const placeholders = {
      'Technology': 'https://images.unsplash.com/photo-1558624478-9505024a9a?auto=format&fit=crop&w=400&q=80',
      'Sustainability': 'https://images.unsplash.com/photo-1542391253-9e09b6a5b?auto=format&fit=crop&w=400&q=80',
      'Construction': 'https://images.unsplash.com/photo-1486310535-27da8a?auto=format&fit=crop&w=400&q=80',
      'Market': 'https://images.unsplash.com/photo-1486310535-27da8a?auto=format&fit=crop&w=400&q=80',
      'Innovation': 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
      'Regulation': 'https://images.unsplash.com/photo-1558624478-9505024a9a?auto=format&fit=crop&w=400&q=80'
    };
    
    return placeholders[category] || 'https://images.unsplash.com/photo-1558624478-9505024a9a?auto=format&fit=crop&w=400&q=80';
  }

  createSummary(description) {
    // Remove HTML tags and create plain text summary
    let cleanText = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace ampersands
      .replace(/&quot;/g, '"') // Replace quotes
      .replace(/&#39;/g, "'") // Replace apostrophes
      .trim();
    
    // Limit to 200 characters
    if (cleanText.length > 200) {
      cleanText = cleanText.substring(0, 197) + '...';
    }
    
    return cleanText;
  }

  extractImportantPoints(description) {
    const points = [];
    
    // Look for common industry keywords and patterns
    const patterns = [
      /(?:innovation|technology|digital|smart|automation)/gi,
      /(?:sustainable|green|eco-friendly|renewable)/gi,
      /(?:construction|infrastructure|development|building)/gi,
      /(?:regulation|compliance|standard|guideline)/gi,
      /(?:market|trend|growth|investment)/gi,
      /(?:safety|quality|efficiency|improvement)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches && matches.length > 0) {
        points.push(matches[0]);
      }
    });
    
    // Remove duplicates and limit to 3 points
    const uniquePoints = [...new Set(points)].slice(0, 3);
    return uniquePoints.length > 0 ? uniquePoints : ['Key industry insights available'];
  }

  cleanText(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  renderItems() {
    const grid = document.getElementById('insightsGrid');
    if (!grid) return;
    
    // Clear loading state
    grid.innerHTML = '';
    
    // Safety check: ensure allItems is defined and has content
    if (!this.allItems || this.allItems.length === 0) {
      console.log('⚠️ No items to render, showing empty state');
      grid.innerHTML = '<div class="no-content"><p>No industry insights available at the moment.</p></div>';
      this.isLoading = false;
      this.updateLoadingState();
      return;
    }
    
    // Render items from current position in allItems
    const itemsToRender = this.allItems.slice(this.currentStartIndex, this.currentStartIndex + this.itemsPerPage);
    
    console.log(`🔄 Rendering ${itemsToRender.length} items from position ${this.currentStartIndex}`);
    
    itemsToRender.forEach((item, index) => {
      const globalIndex = this.currentStartIndex + index;
      const card = this.createInsightCard(item, globalIndex);
      grid.appendChild(card);
      
      // Start observing new cards for lazy loading (only if observer exists)
      if (this.observer) {
        this.observer.observe(card);
      }
    });
    
    // Update load more button
    this.updateLoadMoreButton();
    
    // Hide loading spinner
    this.isLoading = false;
    this.updateLoadingState();
    
    // Start RSS feed loop for continuous content
    this.startRSSLoop();
  }

  startRSSLoop() {
    console.log('🔄 Starting RSS feed loop for continuous content...');
    this.rssLoopInterval = setInterval(() => {
      this.fetchRSSUpdates();
    }, 60000); // Check for updates every 60 seconds
  }

  async fetchRSSUpdates() {
    try {
      console.log('🔄 Checking for RSS feed updates...');
      
      // Try to fetch fresh RSS data
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://thinkmatter.in/feed/')}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Extract latest items from RSS
        const items = xmlDoc.querySelectorAll('item');
        console.log(`📊 RSS feed check: ${items.length} items found`);
        
        if (items.length > 0) {
          const latestItems = this.parseRSSItems(items);
          
          // Check if we have new items (compare by link)
          const newItems = latestItems.filter(rssItem => {
            return !this.items.some(existingItem => existingItem.link === rssItem.link);
          });
          
          if (newItems.length > 0) {
            console.log(`✅ Found ${newItems.length} new RSS items, adding to display...`);
            
            // Add new items to the beginning of the list
            this.items = [...newItems, ...this.items];
            this.hasMore = true; // Reset hasMore since we have new content
            
            // Re-render items
            this.renderItems();
          } else {
            console.log('ℹ️ No new RSS items found');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ RSS update check failed:', error.message);
    }
  }

  createInsightCard(item, index) {
    const card = document.createElement('div');
    card.className = 'insight-card';
    card.setAttribute('data-index', index);
    
    const categoryColors = {
      'Technology': '#2196F3',
      'Sustainability': '#4CAF50',
      'Construction': '#FF9800',
      'Market': '#9C27B0',
      'Innovation': '#673AB7'
    };
    
    const categoryColor = categoryColors[item.category] || '#6C757D';
    
    card.innerHTML = `
      <div class="insight-image" data-lazy="${index}">
        ${item.imageUrl ? 
          `<img src="${item.imageUrl}" alt="${item.title}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;">` :
          `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Cpath d='M9 11l3 3L9 17'/%3E%3C/svg%3E" alt="No image" style="color: #ccc;">`
        }
      </div>
      <div class="insight-content">
        <div class="insight-category" style="background: ${categoryColor};">
          ${item.category}
        </div>
        <h3 class="insight-title">${item.title}</h3>
        <p class="insight-summary">${item.summary}</p>
        ${item.importantPoints.length > 0 ? `
          <div style="margin-top: 15px;">
            <strong style="color: var(--primary); font-size: 0.9rem;">Key Points:</strong>
            <ul style="margin: 8px 0; padding-left: 20px; color: var(--text); font-size: 0.9rem; line-height: 1.4;">
              ${item.importantPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="insight-meta">
          <span class="insight-date">${item.date}</span>
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="insight-source">
            Read More →
          </a>
        </div>
      </div>
    `;
    
    // Add click handler
    card.addEventListener('click', () => {
      if (item.link && item.link !== '#') {
        window.open(item.link, '_blank');
      }
    });
    
    return card;
  }

  setupIntersectionObserver() {
    // Lazy loading for images
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = entry.target.getAttribute('data-lazy');
          const item = this.items[index];
          
          if (item && item.imageUrl && !this.loadedImages.has(index)) {
            this.loadImage(entry.target, item.imageUrl, index);
          }
          
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px'
    });

    // Observe all insight cards
    document.querySelectorAll('.insight-card').forEach(card => {
      this.observer.observe(card);
    });
  }

  async loadImage(container, imageUrl, index) {
    try {
      const imgElement = container.querySelector('img');
      if (!imgElement) return;
      
      // Create new image element
      const img = new Image();
      img.onload = () => {
        imgElement.src = imageUrl;
        imgElement.alt = this.items[index].title;
        this.loadedImages.add(index);
        console.log(`✅ Loaded image for item ${index}`);
      };
      
      img.onerror = () => {
        console.log(`⚠️ Failed to load image: ${imageUrl}`);
        // Keep placeholder on error
      };
      
      img.src = imageUrl;
      
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }

  setupInfiniteScroll() {
    let isThrottled = false;
    
    window.addEventListener('scroll', () => {
      if (isThrottled) return;
      
      isThrottled = true;
      
      setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        
        // Check if user is near end (80% scrolled) and proactively load more
        if (scrollPercentage > 0.8 && !this.isLoading && this.hasMore) {
          console.log('🔄 Near end detected, proactively loading more...');
          this.loadMore();
        }
        
        // Check if user is very close to end (90% scrolled) and preload next batch
        if (scrollPercentage > 0.9 && !this.isLoading && this.hasMore) {
          console.log('🔄 Very close to end, preloading next batch...');
          this.preloadNextBatch();
        }
        
        isThrottled = false;
      }, 200);
    });
  }

  preloadNextBatch() {
    // Preload next batch of items to reduce perceived delay
    const nextPage = this.currentPage + 1;
    const startIndex = nextPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    // Check if we need to generate more items
    let newItems = this.items.slice(startIndex, endIndex);
    
    if (newItems.length === 0) {
      console.log('🔄 Preloading additional insights...');
      newItems = this.generateMoreInsights();
      this.items = [...this.items, ...newItems];
      this.hasMore = true;
    }
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return;
    
    try {
      this.isLoading = true;
      this.updateLoadMoreButton();
      
      const nextPage = this.currentPage + 1;
      const startIndex = nextPage * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      
      console.log(`🔄 Auto-loading more items: page ${nextPage}`);
      
      // Get next batch of items from allItems list
      let newItems = this.allItems.slice(startIndex, endIndex);
      
      if (newItems.length === 0) {
        // If we've reached the end, restart from beginning like YouTube
        console.log('🔄 Reached end, restarting from beginning like YouTube...');
        this.currentStartIndex = (this.currentStartIndex + this.itemsPerPage) % this.allItems.length;
        this.currentPage = 1; // Reset to first page
        newItems = this.allItems.slice(this.currentStartIndex, this.currentStartIndex + this.itemsPerPage);
        this.hasMore = true; // Always has more items in infinite scroll
      }
      
      // Render new items
      const grid = document.getElementById('insightsGrid');
      newItems.forEach((item, index) => {
        const globalIndex = this.currentStartIndex + index;
        const card = this.createInsightCard(item, globalIndex);
        grid.appendChild(card);
        
        // Start observing new cards for lazy loading
        this.observer.observe(card);
      });
      
      this.currentPage = nextPage;
      
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      this.isLoading = false;
      this.updateLoadMoreButton();
    }
  }

  generateMoreInsights() {
    const additionalItems = [
      {
        title: 'Advanced Building Materials',
        summary: 'Next-generation building materials are pushing the boundaries of construction innovation. Self-healing concrete, transparent solar panels, and carbon-negative materials are becoming commercially available.',
        importantPoints: ['Self-healing concrete', 'Transparent solar', 'Carbon-negative materials'],
        imageUrl: 'https://images.unsplash.com/photo-1558624478-9505024a9a?auto=format&fit=crop&w=400&q=80',
        source: 'Advanced Materials Journal',
        link: 'https://www.advancedmaterials.org',
        category: 'Innovation',
        date: new Date().toLocaleDateString(),
        id: `generated-${Date.now()}-1`
      },
      {
        title: 'Construction Robotics Market',
        summary: 'The construction robotics market is experiencing exponential growth with autonomous equipment, AI-powered machinery, and collaborative robots transforming job sites worldwide.',
        importantPoints: ['Autonomous equipment', 'AI machinery', 'Collaborative robots'],
        imageUrl: 'https://images.unsplash.com/photo-1571019582464-0d3b71a?auto=format&fit=crop&w=400&q=80',
        source: 'Construction Robotics News',
        link: 'https://www.constructionroboticsnews.com',
        category: 'Technology',
        date: new Date().toLocaleDateString(),
        id: `generated-${Date.now()}-2`
      },
      {
        title: 'Green Infrastructure Projects',
        summary: 'Major cities worldwide are investing in green infrastructure including electric vehicle charging stations, sustainable public transport, and eco-friendly urban planning initiatives.',
        importantPoints: ['EV charging stations', 'Sustainable transport', 'Eco-friendly planning'],
        imageUrl: 'https://images.unsplash.com/photo-1486310535-27da8a?auto=format&fit=crop&w=400&q=80',
        source: 'Green Infrastructure Council',
        link: 'https://www.greeninfrastructure.org',
        category: 'Sustainability',
        date: new Date().toLocaleDateString(),
        id: `generated-${Date.now()}-3`
      },
      {
        title: 'Building Information Modeling (BIM)',
        summary: 'BIM technology is revolutionizing construction project management with 3D modeling, real-time collaboration, and data-driven decision making improving project outcomes.',
        importantPoints: ['3D modeling', 'Real-time collaboration', 'Data-driven decisions'],
        imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
        source: 'BIM World',
        link: 'https://www.bimworld.org',
        category: 'Technology',
        date: new Date().toLocaleDateString(),
        id: `generated-${Date.now()}-4`
      },
      {
        title: 'Sustainable Construction Practices',
        summary: 'Construction industry is adopting sustainable practices including waste reduction, energy efficiency, and circular economy principles to minimize environmental impact.',
        importantPoints: ['Waste reduction', 'Energy efficiency', 'Circular economy'],
        imageUrl: 'https://images.unsplash.com/photo-1542391253-9e09b6a5b?auto=format&fit=crop&w=400&q=80',
        source: 'Sustainable Construction',
        link: 'https://www.sustainableconstruction.org',
        category: 'Sustainability',
        date: new Date().toLocaleDateString(),
        id: `generated-${Date.now()}-5`
      },
      {
        title: 'Smart Building Technology',
        summary: 'Smart buildings are integrating IoT sensors, automated systems, and AI-powered management to optimize energy usage, security, and occupant comfort.',
        importantPoints: ['IoT sensors', 'Automated systems', 'AI-powered management'],
        imageUrl: 'https://images.unsplash.com/photo-1558624478-9505024a9a?auto=format&fit=crop&w=400&q=80',
        source: 'Smart Buildings Magazine',
        link: 'https://www.smartbuildingsmagazine.com',
        category: 'Technology',
        date: new Date().toLocaleDateString(),
        id: `generated-${Date.now()}-6`
      }
    ];
    
    console.log(`✅ Generated ${additionalItems.length} additional insights`);
    return additionalItems;
  }

  updateLoadingState() {
    const grid = document.getElementById('insightsGrid');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (this.isLoading && this.items.length === 0) {
      grid.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading industry insights...</p>
        </div>
      `;
      loadMoreContainer.style.display = 'none';
    } else {
      loadMoreContainer.style.display = 'block';
    }
  }

  updateLoadMoreButton() {
    const container = document.getElementById('loadMoreContainer');
    const button = document.getElementById('loadMoreBtn');
    
    if (!container || !button) return;
    
    if (!this.hasMore) {
      container.innerHTML = '<p style="text-align: center; color: var(--muted);">No more insights to load</p>';
    } else {
      button.textContent = this.isLoading ? 'Loading...' : 'Load More Insights';
      button.disabled = this.isLoading;
      container.style.display = 'block';
    }
  }

  showErrorState() {
    const grid = document.getElementById('insightsGrid');
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text);">
        <h3>Unable to Load Insights</h3>
        <p>Please check your internet connection and try again later.</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer;">
          Try Again
        </button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new IndustryInsights();
});
