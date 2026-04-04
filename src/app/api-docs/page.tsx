'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamic import to avoid SSR issues with swagger-ui-react
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">API-Dokumentation wird geladen...</p>
      </div>
    </div>
  )
});

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-green-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ForstManager API</h1>
            <p className="text-green-200 text-sm">OpenAPI 3.0 Dokumentation</p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/api/docs" 
              target="_blank"
              className="text-sm bg-green-800 hover:bg-green-900 px-4 py-2 rounded transition-colors"
            >
              📄 JSON Spec
            </a>
            <a 
              href="/"
              className="text-sm bg-green-800 hover:bg-green-900 px-4 py-2 rounded transition-colors"
            >
              ← Zurück zum Dashboard
            </a>
          </div>
        </div>
      </div>
      
      {/* Swagger UI */}
      <div className="swagger-wrapper">
        <SwaggerUI 
          url="/api/docs" 
          docExpansion="list"
          defaultModelsExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          tryItOutEnabled={false}
        />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          color: #166534;
        }
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e7eb;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #166534;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #1d4ed8;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #ca8a04;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #dc2626;
        }
        .swagger-ui .btn.execute {
          background-color: #166534;
          border-color: #166534;
        }
        .swagger-ui .btn.execute:hover {
          background-color: #14532d;
        }
      `}</style>
    </div>
  );
}
