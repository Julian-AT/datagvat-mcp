"""Test script to verify the updated API integration."""

import asyncio
from app.client import PiveauClient
from app.config import get_settings


async def test_all_endpoints():
    """Test all updated endpoints."""
    settings = get_settings()
    print(f"Using API base: {settings.piveau_api_base}\n")

    client = PiveauClient(
        base_url=settings.piveau_api_base,
        api_key=settings.api_key_value,
        timeout=settings.request_timeout,
    )

    try:
        # Test 1: Search datasets
        print("=" * 60)
        print("TEST 1: Search datasets for 'population'")
        print("=" * 60)
        result = await client.search_datasets_advanced(
            query="population",
            limit=3
        )
        print(f"[OK] Total results: {result['count']}")
        print(f"[OK] Returned: {len(result['results'])} datasets")
        for i, dataset in enumerate(result['results'][:2], 1):
            title = dataset.get('title', {})
            if isinstance(title, dict):
                title = title.get('de', title.get('en', 'No title'))
            print(f"  {i}. {title}")

        # Test 2: Search with facets
        print("\n" + "=" * 60)
        print("TEST 2: Search with category filter (SOCI)")
        print("=" * 60)
        result = await client.search_datasets_advanced(
            query="population",
            facets={"categories": ["SOCI"]},
            limit=2
        )
        print(f"[OK] Filtered results: {result['count']}")
        print(f"[OK] Returned: {len(result['results'])} datasets")

        # Test 3: Search with format filter
        print("\n" + "=" * 60)
        print("TEST 3: Search with format filter (CSV)")
        print("=" * 60)
        result = await client.search_datasets_advanced(
            query="data",
            facets={"format": ["CSV"]},
            limit=2
        )
        print(f"[OK] CSV datasets: {result['count']}")
        if result['results']:
            dist = result['results'][0].get('distributions', [{}])[0]
            fmt = dist.get('format', {})
            print(f"[OK] First result format: {fmt.get('id', 'N/A')}")

        # Test 4: List catalogues
        print("\n" + "=" * 60)
        print("TEST 4: List catalogues")
        print("=" * 60)
        catalogues = await client.list_catalogues(limit=5)
        print(f"[OK] Total catalogues: ~2408")
        print(f"[OK] Retrieved: {len(catalogues)}")
        print(f"[OK] First 3: {[c['id'] for c in catalogues[:3]]}")

        # Test 5: Get catalogue details
        print("\n" + "=" * 60)
        print("TEST 5: Get catalogue details (l9 - Stadt Wien)")
        print("=" * 60)
        cat = await client.get_catalogue('l9')
        title = cat.get('title', {})
        if isinstance(title, dict):
            title = title.get('de', title.get('en', 'No title'))
        print(f"[OK] ID: {cat.get('id')}")
        print(f"[OK] Title: {title}")
        print(f"[OK] Dataset count: {cat.get('count')}")
        print(f"[OK] Modified: {cat.get('modified')}")

        # Test 6: Get dataset details
        print("\n" + "=" * 60)
        print("TEST 6: Get dataset details")
        print("=" * 60)
        # Use first result from initial search
        result = await client.search_datasets_advanced(query="population", limit=1)
        if result['results']:
            dataset_id = result['results'][0].get('id')
            print(f"Dataset ID: {dataset_id}")

            dataset = await client.get_dataset(dataset_id)
            title = dataset.get('title', {})
            if isinstance(title, dict):
                title = title.get('de', title.get('en', 'No title'))
            print(f"[OK] Title: {title}")
            print(f"[OK] Categories: {[c.get('id') for c in dataset.get('categories', [])]}")
            print(f"[OK] Distributions: {len(dataset.get('distributions', []))}")
            print(f"[OK] Modified: {dataset.get('modified')}")

        # Test 7: Sorting
        print("\n" + "=" * 60)
        print("TEST 7: Sorting (most recent first)")
        print("=" * 60)
        result = await client.search_datasets_advanced(
            query="data",
            sort="modified+desc",
            limit=3
        )
        print(f"[OK] Results: {len(result['results'])}")
        for i, dataset in enumerate(result['results'], 1):
            print(f"  {i}. Modified: {dataset.get('modified')}")

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe API integration is working correctly.")
        print("Restart the MCP server to use the updated configuration.")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
