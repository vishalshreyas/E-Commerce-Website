# titaniumaplus

## Project - Products Management

## Topics to introduce
1) Pagination
2) Caching using Redis
3) File upload to S3

### Key points
- Create a group database `groupXDatabase`. You can clean the db you previously used and resue that.
- This time each group should have a *single git branch*. Coordinate amongst yourselves by ensuring every next person pulls the code last pushed by a team mate. You branch will be checked as part of the demo. Branch name should follow the naming convention `project/productsManagementGroupX`
- Follow the naming conventions exactly as instructed.

### Models
- User Model
```yaml
{ 
  fname: {string, mandatory},
  lname: {string, mandatory},
  email: {string, mandatory, valid email, unique},
  profileImage: {string, mandatory}, // s3 link
  phone: {string, mandatory, unique, valid Indian mobile number},
  password: {string, mandatory, minLen 8, maxLen 15}, // encrypted password
  address: {
    shipping: {
      street: {string},
      city: {string},
      pincode: {string}
    }, {mandatory}
    billing: {
      street: {string},
      city: {string},
      pincode: {string}
    }
  },
  createdAt: {timestamp},
  updatedAt: {timestamp}
}
```

- Product Model
```yaml
{ 
  title: {string, mandatory, unique},
  description: {string, mandatory},
  price: {number, mandatory, valid number/decimal},
  currencyId: {string, mandatory, INR},
  currencyFormat: {string, mandatory, Rupee symbol},
  isFreeShipping: {boolean, default: false},
  productImage: {string, mandatory},  // s3 link
  style: {string},
  availableSizes: {array of string, at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},
  installments: {number},
  deletedAt: {Date, when the document is deleted}, 
  isDeleted: {boolean, default: false},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```

- Cart Model
```yaml
{
  userId: {ObjectId, refs to User, mandatory, unique},
  items: [{
    productId: {ObjectId, refs to Product model, mandatory},
    quantity: {number, mandatory, min 1}
  }],
  totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
  totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```

- Order Model
```yaml
{
  userId: {ObjectId, refs to User, mandatory},
  items: [{
    productId: {ObjectId, refs to Product model, mandatory},
    quantity: {number, mandatory, min 1}
  }],
  totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
  totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
  totalQuantity: {number, mandatory, comment: "Holds total number of items in the cart"},
  cancellable: {boolean, default: true},
  status: {string, default: 'pending', enum[pending, completed, cancled]}
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```

## User APIs 
### POST /register
- Create a user document from request body. Request body must contain image.
- Upload image to S3 bucket and save it's public url in user document.
- Save password in encrypted format. (use bcrypt)
- __Response format__
  - _**On success**_ - Return HTTP status 201. Also return the user document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### POST /login
- Allow an user to login with their email and password.
- On a successful login attempt return a JWT token contatining the userId, exp, iat.
- __Response format__
  - _**On success**_ - Return HTTP status 200 and JWT token in response body. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## GET /user/:userId/profile
- Get an user profile
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated user document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## PUT /user/:userId/profile
- Allow an user to update their profile.
- A user can update all the fields
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated user document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## Products API (_No authentication required_)
### POST /products
- Create a product document from request body.
- Upload product image to S3 bucket and save image public url in document.
- __Response format__
  - _**On success**_ - Return HTTP status 201. Also return the product document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### GET /products
- Returns all products in the collection that aren't deleted.
  - __Filters__
    - Size
    - Product name
    - Price - greater than or less than
  - __Sort__
    - Sorted by product price in ascending or descending
  _eg_ /products?size=XL&name=Nit%20grit
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the product documents. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### GET /products/:productId
- Returns product details by product id
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the product documents. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### PUT /products/:productId
- Updates a product by changing at least one or all fields
- Check if the productId exists (must have isDeleted false and is present in collection). If it doesn't, return an HTTP status 404 with a response body like [this](#error-response-structure)
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated product document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### DELETE /products/:productId
- Deletes a product by product id if it's not already deleted
- __Response format__
  - _**On success**_ - Return HTTP status 200. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## Cart APIs (_authentication required as authorization header - bearer token_)
### POST /users/:userId/cart (Add to cart)
- Create a cart for the user if it does not exist. Else add product(s) in cart.
- Get cart id in request body.
- Make sure that cart exist.
- Add a product(s) for a user in the cart.
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Make sure the product(s) are valid and not deleted.
- Get product(s) details in request body.
- __Response format__
  - _**On success**_ - Return HTTP status 201. Also return the cart document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### PUT /users/:userId/cart (Remove product from the cart)
- Get cart id in request body.
- Make sure that cart exist.
- Remove product(s) from cart.
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Check if the productId exists and is not deleted before updating the cart.
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated cart document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

### GET /users/:userId/cart
- Returns cart summary of the user.
- Make sure that cart exist.
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated product document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## Checkout/Order APIs (Authentication and authorization required)
### POST /users/:userId/orders
- Create an order for the user
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Get cart details in the request body
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the order document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## PUT /users/:userId/orders
- Updates an order status
- Make sure the userId in params and in JWT token match.
- Make sure the user exist
- Get order id in request body
- Make sure the order belongs to the user
- __Response format__
  - _**On success**_ - Return HTTP status 200. Also return the updated order document. The response should be a JSON object like [this](#successful-response-structure)
  - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

## Testing 
- To test these apis create a new collection in Postman named Project 3 products Management 
- Each api should have a new request in this collection
- Each request in the collection should be rightly named. Eg Create user, Create product, Get products etc
- Each member of each team should have their tests in running state

Refer below sample
 ![A Postman collection and request sample](assets/Postman-collection-sample.png)

## Response

### Successful Response structure
```yaml
{
  status: true,
  message: 'Success',
  data: {

  }
}
```
### Error Response structure
```yaml
{
  status: false,
  message: ""
}
```

## Collections
## users
```yaml
{
  _id: ObjectId("88abc190ef0288abc190ef02"),
  fname: 'John',
  lname: 'Doe',
  email: 'johndoe@mailinator.com',
  profileImage: 'http://function-up-test.s3.amazonaws.com/users/johndoe.jpg', // s3 link
  phone: 9876543210,
  password: '$2b$10$O.hrbBPCioVm237nAHYQ5OZy6k15TOoQSFhTT.recHBfQpZhM55Ty', // encrypted password
  address: {
    shipping: {
      street: "110, Ridhi Sidhi Tower",
      city: "Jaipur",
      pincode: 400001
    }, {mandatory}
    billing: {
      street: "110, Ridhi Sidhi Tower",
      city: "Jaipur",
      pincode: 400001
    }
  },
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```
### products
```yaml
{
  _id: ObjectId("88abc190ef0288abc190ef55"),
  title: 'Nit Grit',
  description: 'Dummy description',
  price: 23.0,
  currencyId: 'INR',
  currencyFormat: '₹',
  isFreeShipping: false,
  productImage: 'http://function-up-test.s3.amazonaws.com/products/nitgrit.jpg',  // s3 link
  style: 'Colloar',
  availableSizes: ["S", "XS","M","X", "L","XXL", "XL"],
  installments: 5,
  deletedAt: null, 
  isDeleted: false,
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```

### carts
```yaml
{
  "_id": ObjectId("88abc190ef0288abc190ef88"),
  userId: ObjectId("88abc190ef0288abc190ef02"),
  items: [{
    productId: ObjectId("88abc190ef0288abc190ef55"),
    quantity: 2
  }, {
    productId: ObjectId("88abc190ef0288abc190ef60"),
    quantity: 1
  }],
  totalPrice: 50.99,
  totalItems: 2,
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```

### orders
```yaml
{
  "_id": ObjectId("88abc190ef0288abc190ef88"),
  userId: ObjectId("88abc190ef0288abc190ef02"),
  items: [{
    productId: ObjectId("88abc190ef0288abc190ef55"),
    quantity: 2
  }, {
    productId: ObjectId("88abc190ef0288abc190ef60"),
    quantity: 1
  }],
  totalPrice: 50.99,
  totalItems: 2,
  totalQuantity: 3,
  cancellable: true,
  status: 'pending'}
  createdAt: "2021-09-17T04:25:07.803Z",
  updatedAt: "2021-09-17T04:25:07.803Z",
}
```
