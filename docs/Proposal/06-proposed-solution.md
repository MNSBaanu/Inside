# Proposed Solution

The proposed solution is a web-based Interior Design Service Platform that provides a centralized environment for clients and interior designers to discover, communicate, collaborate, and manage design projects. The platform supports the complete interaction process from designer discovery and project requests to project tracking, reviews, and milestone-based payments.

Clients are able to browse designer portfolios, explore completed design projects, save design inspirations, and submit project requests based on their requirements. Designers can manage their portfolios, respond to project requests with proposals, communicate with clients, and track the progress of active projects. The platform also provides project tracking, notifications, review and rating functionality, and secure payment handling to support transparency throughout the project lifecycle.

The system follows a three-tier architecture consisting of a presentation layer, an application layer, and a data layer. The presentation layer is developed using Next.js and provides interfaces for clients, designers, and administrators. The application layer is implemented using ASP.NET Core 8 Web API and contains the business logic and system services. The data layer utilizes AWS cloud services, including a relational database for data storage and object storage for project files and images. Stripe is integrated to support secure payment and payout processing.

The proposed architecture promotes scalability, maintainability, and separation of concerns while supporting the functional requirements of the system.

