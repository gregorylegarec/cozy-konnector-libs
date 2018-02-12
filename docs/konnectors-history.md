# Konnector synchronized data (or Sync Data)

## Problems

Except bank konnector which already solve the addressed problem, all konnectors are currently processing data they are collecting in the same way:

* Get all data to synchronize
* Store it in CouchDB, even if it means overriding previously synchronized data.

This process has at least two major flows :
* We are always synchronizing _all_ the data provided by the external service.
* When something is modified (for example, the name of the stored file, its almost sure that the previous one will be kept and that we'll have a duplicate)

Another side effect could be that in a very large set of documents to synchronize, the whole process may take more than 3 minutes and never synchronize documents at the end of the list.

## Objectives of this document

*

The goal of sync data is to be able to store


This document describes how Cozy recommends to handle konnectors history.

Konnector history is used to determine which data has already been synchronized with a remote service or API.

## Aborted solution : new doctype

At first we have been thinking about using a new doctype to manage history, maybe something like `io.cozy.konnectors.histories`.
This doctype would have been used to store all the history relative data, such as document's id from service, last synchronization date, etc.
We did not keep this solution because it was impling a strong relation between every synchronized document and the associated  history document. This would have cause side effect and would have introduce desynchronization errors.
Also it would have needed to declare a new permission to this particular doctype.

## Composing documents with synchronization metadata

The idea we kept is eventually very simple as we are only using metadata for synchronized documents. This pattern is totally compatible with NoSQL databases such as CouchDB. Furthermore, our bank konnectors was already using this kind of data to keep an history.

## How to deal with konnectors history

### Storing

We recommend to store history information in a `sync` attribute in document `metadata` attribute. Example:

```json
{
  "metadata": {
    "sync": {
      "id": "7ee401e841c94159addb47f190903139"
    }
  }
}
```

The information to save must be determinated by konnector developers. By the way we recommend to use following information, as a basis:

| field | role |
|-------|------|
| id        | The id of the document, but given by the external service. If the external service does not provide any id or uuid, it could be interesting to generate one, with an hash of the file for example.
| konnector | The slug of the konnector (Example: `trainline`, `freemobile`, `cic`). This could be very useful to retrieve data synchronized with this konnector.
| last_sync_date | Depending on how a konnector

This is just a suggestion, contributors are let free to determine what data is useful for their own konnector history.

### Helper

#### Saving

As provider of `cozy-konnector-libs`, we should provide a standard way to deal with history, for example with helper dedicated to manage this kind of data.
The goal of those helpers should be to encapsulate the logic related to the `metadata.sync` attribute.
Those helpers may look like this:

```js
saveBills(bills.map(bill => KonnectorHistory.tag(bill, { id: bill.uuid })))
```

The `KonnectorHistory.tag` method should also take a mapping fuction as second parameter.

This method should return a new document with the `metadata.sync` informations updated. Based on the `manifest.konnector` file, it should also automatically update the `metadata.sync.konnector` attribute:

```js
{
  metadata: {
    sync: {
      id: '7ee401e841c94159addb47f190903139',
      konnector: 'trainline'
    }
  }
  name: 'mybill-2018-01-06'
}
```


#### Accessing history data

We should also encapsulate the query logic into those same helpers. To look after a given document or query all documents synced by the given konnector.

Our helper should provide methods like the followings:

* `KonnectorHistory.find(attributes)`
* `KonnectorHistory.findAll()`
* `KonnectorHistory.exists(attribtues)`
* etc.
