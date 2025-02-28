import React from 'react';
import { useParams, Link } from 'react-router-dom';

function CategoryPage({ products }) {
  const { category } = useParams();
  let categoryProducts = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());

  // Mock gifts category if no products found
  if (category.toLowerCase() === 'gifts' && categoryProducts.length === 0) {
    categoryProducts = [
      { id: 7, name: 'Teddy Bear', price: 15, image: '/images/teddy.jpg', category: 'gifts' },
      { id: 8, name: 'Chocolates', price: 10, image: '/images/chocs.jpg', category: 'gifts' },
      { id: 9, name: 'Balloon Bouquet', price: 8, image: '/images/balloons.jpg', category: 'gifts' },
    ];
  }

  return (
    <section className="container py-5">
      <h2 className="text-center mb-4">{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
      <div className="row">
        {categoryProducts.length > 0 ? (
          categoryProducts.map(product => (
            <div className="col-md-4 mb-4" key={product.id}>
              <div className="card">
                <img src={product.image} alt={product.name} className="card-img-top" />
                <div className="card-body">
                  <h5 className="card-title" style={{ fontSize: '1.5rem' }}>{product.name}</h5>
                  <p className="card-text" style={{ fontSize: '1.5rem' }}>${product.price}</p>
                  <Link
                    to={`/product/${product.id}`}
                    className="btn btn-outline-primary custom-outline-btn" // Added custom-outline-btn
                    style={{ borderColor: '#edafb8', color: '#edafb8' }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No products found in this category.</p>
        )}
      </div>
    </section>
  );
}

export default CategoryPage;