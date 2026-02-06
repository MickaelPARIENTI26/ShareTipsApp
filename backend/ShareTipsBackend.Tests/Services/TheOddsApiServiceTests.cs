using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using ShareTipsBackend.Services.ExternalApis;
using System.Net;
using System.Text.Json;

namespace ShareTipsBackend.Tests.Services;

public class TheOddsApiServiceTests
{
    private readonly Mock<ILogger<TheOddsApiService>> _loggerMock;
    private readonly TheOddsApiConfig _config;

    public TheOddsApiServiceTests()
    {
        _loggerMock = new Mock<ILogger<TheOddsApiService>>();
        _config = new TheOddsApiConfig
        {
            ApiKey = "test-api-key",
            BaseUrl = "https://api.the-odds-api.com",
            Region = "eu",
            Bookmakers = "winamax_fr",
            FallbackBookmaker = "parionssport_fr",
            OddsFormat = "decimal",
            DateFormat = "iso",
            EnabledSportKeys = new List<string> { "soccer_france_ligue_one", "basketball_nba" },
            FootballMarkets = new List<string> { "h2h", "spreads", "totals", "btts", "draw_no_bet" },
            BasketballMarkets = new List<string> { "h2h", "spreads", "totals" },
            FootballPlayerProps = new List<string> { "player_goal_scorer_anytime" },
            BasketballPlayerProps = new List<string> { "player_points", "player_rebounds" }
        };
    }

    private TheOddsApiService CreateService(HttpClient httpClient)
    {
        return new TheOddsApiService(
            httpClient,
            Options.Create(_config),
            _loggerMock.Object
        );
    }

    private HttpClient CreateMockHttpClient(HttpStatusCode statusCode, string responseContent, Dictionary<string, string>? headers = null)
    {
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() =>
            {
                var response = new HttpResponseMessage(statusCode)
                {
                    Content = new StringContent(responseContent)
                };

                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        response.Headers.TryAddWithoutValidation(header.Key, header.Value);
                    }
                }

                return response;
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };

        return httpClient;
    }

    [Fact]
    public async Task GetSportsAsync_ReturnsListOfSports()
    {
        // Arrange
        var sportsResponse = new List<OddsApiSport>
        {
            new("soccer_france_ligue_one", "Soccer", "Ligue 1 - France", "French top league", true, false),
            new("basketball_nba", "Basketball", "NBA", "National Basketball Association", true, false)
        };
        var json = JsonSerializer.Serialize(sportsResponse);
        var httpClient = CreateMockHttpClient(HttpStatusCode.OK, json, new Dictionary<string, string>
        {
            { "x-requests-remaining", "450" },
            { "x-requests-used", "50" }
        });
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetSportsAsync();

        // Assert
        result.Should().HaveCount(2);
        result.First().Key.Should().Be("soccer_france_ligue_one");
        service.RequestsRemaining.Should().Be(450);
        service.RequestsUsed.Should().Be(50);
    }

    [Fact]
    public async Task GetEventsAsync_ReturnsListOfEvents()
    {
        // Arrange
        var eventsResponse = new List<OddsApiEvent>
        {
            new("event1", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow.AddDays(1), "PSG", "OM"),
            new("event2", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow.AddDays(2), "Lyon", "Monaco")
        };
        var json = JsonSerializer.Serialize(eventsResponse);
        var httpClient = CreateMockHttpClient(HttpStatusCode.OK, json);
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetEventsAsync("soccer_france_ligue_one");

        // Assert
        result.Should().HaveCount(2);
        result.First().HomeTeam.Should().Be("PSG");
        result.First().AwayTeam.Should().Be("OM");
    }

    [Fact]
    public async Task GetOddsAsync_UsesFootballMarketsForSoccerSport()
    {
        // Arrange
        var eventsResponse = new List<OddsApiEventWithOdds>();
        var json = JsonSerializer.Serialize(eventsResponse);

        HttpRequestMessage? capturedRequest = null;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };
        var service = CreateService(httpClient);

        // Act
        await service.GetOddsAsync("soccer_france_ligue_one");

        // Assert
        capturedRequest.Should().NotBeNull();
        var requestUrl = capturedRequest!.RequestUri!.ToString();
        requestUrl.Should().Contain("markets=h2h,spreads,totals,btts,draw_no_bet");
        requestUrl.Should().Contain("bookmakers=winamax_fr");
    }

    [Fact]
    public async Task GetOddsAsync_UsesBasketballMarketsForBasketballSport()
    {
        // Arrange
        var eventsResponse = new List<OddsApiEventWithOdds>();
        var json = JsonSerializer.Serialize(eventsResponse);

        HttpRequestMessage? capturedRequest = null;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };
        var service = CreateService(httpClient);

        // Act
        await service.GetOddsAsync("basketball_nba");

        // Assert
        capturedRequest.Should().NotBeNull();
        var requestUrl = capturedRequest!.RequestUri!.ToString();
        requestUrl.Should().Contain("markets=h2h,spreads,totals");
        requestUrl.Should().NotContain("btts");
        requestUrl.Should().NotContain("draw_no_bet");
    }

    [Fact]
    public async Task GetOddsAsync_UsesBookmakerOverrideWhenProvided()
    {
        // Arrange
        var eventsResponse = new List<OddsApiEventWithOdds>();
        var json = JsonSerializer.Serialize(eventsResponse);

        HttpRequestMessage? capturedRequest = null;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };
        var service = CreateService(httpClient);

        // Act
        await service.GetOddsAsync("soccer_france_ligue_one", null, "parionssport_fr");

        // Assert
        capturedRequest.Should().NotBeNull();
        var requestUrl = capturedRequest!.RequestUri!.ToString();
        requestUrl.Should().Contain("bookmakers=parionssport_fr");
        requestUrl.Should().NotContain("winamax_fr");
    }

    [Fact]
    public async Task GetOddsWithFallbackAsync_UsesFallbackWhenNoOdds()
    {
        // Arrange
        var emptyOddsResponse = new List<OddsApiEventWithOdds>
        {
            new("event1", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow.AddDays(1), "PSG", "OM", new List<OddsApiBookmaker>())
        };
        var oddsWithFallback = new List<OddsApiEventWithOdds>
        {
            new("event1", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow.AddDays(1), "PSG", "OM",
                new List<OddsApiBookmaker>
                {
                    new("parionssport_fr", "Parions Sport", DateTime.UtcNow, new List<OddsApiMarket>
                    {
                        new("h2h", DateTime.UtcNow, new List<OddsApiOutcome>
                        {
                            new("PSG", 1.50m, null, null)
                        })
                    })
                })
        };

        var callCount = 0;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync((HttpRequestMessage req, CancellationToken _) =>
            {
                callCount++;
                var json = callCount == 1
                    ? JsonSerializer.Serialize(emptyOddsResponse)
                    : JsonSerializer.Serialize(oddsWithFallback);
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json)
                };
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetOddsWithFallbackAsync("soccer_france_ligue_one");

        // Assert
        callCount.Should().Be(2); // Primary + Fallback
        result.First().Bookmakers.Should().HaveCount(1);
        result.First().Bookmakers.First().Key.Should().Be("parionssport_fr");
    }

    [Fact]
    public async Task GetOddsWithFallbackAsync_DoesNotFallbackWhenOddsExist()
    {
        // Arrange
        var oddsResponse = new List<OddsApiEventWithOdds>
        {
            new("event1", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow.AddDays(1), "PSG", "OM",
                new List<OddsApiBookmaker>
                {
                    new("winamax_fr", "Winamax", DateTime.UtcNow, new List<OddsApiMarket>
                    {
                        new("h2h", DateTime.UtcNow, new List<OddsApiOutcome>
                        {
                            new("PSG", 1.50m, null, null)
                        })
                    })
                })
        };

        var callCount = 0;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() =>
            {
                callCount++;
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(oddsResponse))
                };
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetOddsWithFallbackAsync("soccer_france_ligue_one");

        // Assert
        callCount.Should().Be(1); // Only primary, no fallback
        result.First().Bookmakers.First().Key.Should().Be("winamax_fr");
    }

    [Fact]
    public async Task GetScoresAsync_ReturnsScores()
    {
        // Arrange
        var scoresResponse = new List<OddsApiScore>
        {
            new("event1", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow.AddHours(-2), "PSG", "OM", true,
                new List<OddsApiTeamScore>
                {
                    new("PSG", 3),
                    new("OM", 1)
                })
        };
        var json = JsonSerializer.Serialize(scoresResponse);
        var httpClient = CreateMockHttpClient(HttpStatusCode.OK, json);
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetScoresAsync("soccer_france_ligue_one");

        // Assert
        result.Should().HaveCount(1);
        result.First().Completed.Should().BeTrue();
        result.First().Scores.Should().HaveCount(2);
        result.First().Scores!.First(s => s.Name == "PSG").Score.Should().Be(3);
    }

    [Fact]
    public async Task GetScoresAsync_IncludesDaysFromWhenProvided()
    {
        // Arrange
        var scoresResponse = new List<OddsApiScore>();
        var json = JsonSerializer.Serialize(scoresResponse);

        HttpRequestMessage? capturedRequest = null;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            });

        var httpClient = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri(_config.BaseUrl)
        };
        var service = CreateService(httpClient);

        // Act
        await service.GetScoresAsync("soccer_france_ligue_one", daysFrom: 3);

        // Assert
        capturedRequest.Should().NotBeNull();
        var requestUrl = capturedRequest!.RequestUri!.ToString();
        requestUrl.Should().Contain("daysFrom=3");
    }

    [Fact]
    public async Task GetEventOddsAsync_ReturnsNullWhenNoPlayerProps()
    {
        // Arrange
        var config = new TheOddsApiConfig
        {
            ApiKey = "test-key",
            BaseUrl = "https://api.the-odds-api.com",
            FootballPlayerProps = new List<string>() // Empty
        };
        var httpClient = CreateMockHttpClient(HttpStatusCode.OK, "{}");
        var service = new TheOddsApiService(
            httpClient,
            Options.Create(config),
            _loggerMock.Object
        );

        // Act
        var result = await service.GetEventOddsAsync("soccer_france_ligue_one", "event1");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetEventOddsAsync_ReturnsNullOnNotFound()
    {
        // Arrange
        var httpClient = CreateMockHttpClient(HttpStatusCode.NotFound, "");
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetEventOddsAsync("soccer_france_ligue_one", "nonexistent");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetLiveScoresAsync_MapsToExternalScoreData()
    {
        // Arrange
        var scoresResponse = new List<OddsApiScore>
        {
            new("event1", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow, "PSG", "OM", false,
                new List<OddsApiTeamScore>
                {
                    new("PSG", 2),
                    new("OM", 0)
                }),
            new("event2", "soccer_france_ligue_one", "Ligue 1", DateTime.UtcNow, "Lyon", "Monaco", true,
                new List<OddsApiTeamScore>
                {
                    new("Lyon", 1),
                    new("Monaco", 1)
                })
        };
        var json = JsonSerializer.Serialize(scoresResponse);
        var httpClient = CreateMockHttpClient(HttpStatusCode.OK, json);
        var service = CreateService(httpClient);

        // Act
        var result = await service.GetLiveScoresAsync("FOOTBALL");

        // Assert
        var scores = result.ToList();
        scores.Should().HaveCount(2);

        var liveGame = scores.First(s => s.ExternalMatchId == "event1");
        liveGame.HomeScore.Should().Be(2);
        liveGame.AwayScore.Should().Be(0);
        liveGame.Status.Should().Be("LIVE");

        var finishedGame = scores.First(s => s.ExternalMatchId == "event2");
        finishedGame.Status.Should().Be("FINISHED");
    }

    [Fact]
    public void GetRemainingQuota_ReturnsNull_WhenNoApiCallMade()
    {
        // Arrange
        var httpClient = CreateMockHttpClient(HttpStatusCode.OK, "[]");
        var service = CreateService(httpClient);

        // Act
        var remaining = service.RequestsRemaining;
        var used = service.RequestsUsed;

        // Assert
        remaining.Should().BeNull();
        used.Should().BeNull();
    }
}

public class TheOddsApiConfigTests
{
    [Theory]
    [InlineData("soccer_france_ligue_one", true)]
    [InlineData("soccer_epl", true)]
    [InlineData("basketball_nba", false)]
    [InlineData("basketball_euroleague", false)]
    public void GetMarketsForSport_ReturnsSportSpecificMarkets(string sportKey, bool shouldIncludeBtts)
    {
        // Arrange
        var config = new TheOddsApiConfig
        {
            FootballMarkets = new List<string> { "h2h", "btts", "draw_no_bet" },
            BasketballMarkets = new List<string> { "h2h", "spreads" }
        };

        // Act
        var markets = config.GetMarketsForSport(sportKey);

        // Assert
        markets.Should().Contain("h2h");
        if (shouldIncludeBtts)
        {
            markets.Should().Contain("btts");
        }
        else
        {
            markets.Should().NotContain("btts");
        }
    }

    [Theory]
    [InlineData("soccer_france_ligue_one", "player_goal_scorer_anytime")]
    [InlineData("basketball_nba", "player_points")]
    public void GetPlayerPropsForSport_ReturnsSportSpecificProps(string sportKey, string expectedProp)
    {
        // Arrange
        var config = new TheOddsApiConfig
        {
            FootballPlayerProps = new List<string> { "player_goal_scorer_anytime" },
            BasketballPlayerProps = new List<string> { "player_points", "player_rebounds" }
        };

        // Act
        var props = config.GetPlayerPropsForSport(sportKey);

        // Assert
        props.Should().Contain(expectedProp);
    }

    [Theory]
    [InlineData("soccer_france_ligue_one", true)]
    [InlineData("basketball_nba", true)]
    public void SyncPlayerPropsForSport_ReturnsTrueWhenPropsConfigured(string sportKey, bool expected)
    {
        // Arrange
        var config = new TheOddsApiConfig
        {
            FootballPlayerProps = new List<string> { "player_goal_scorer_anytime" },
            BasketballPlayerProps = new List<string> { "player_points" }
        };

        // Act
        var result = config.SyncPlayerPropsForSport(sportKey);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void SyncPlayerPropsForSport_ReturnsFalseWhenNoPropsConfigured()
    {
        // Arrange
        var config = new TheOddsApiConfig
        {
            FootballPlayerProps = new List<string>(),
            BasketballPlayerProps = new List<string>()
        };

        // Act
        var result = config.SyncPlayerPropsForSport("soccer_france_ligue_one");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void EnabledMarkets_ReturnsUnionOfAllMarkets()
    {
        // Arrange
        var config = new TheOddsApiConfig
        {
            FootballMarkets = new List<string> { "h2h", "btts", "draw_no_bet" },
            BasketballMarkets = new List<string> { "h2h", "spreads", "totals" }
        };

        // Act
        var allMarkets = config.EnabledMarkets;

        // Assert
        allMarkets.Should().Contain("h2h");
        allMarkets.Should().Contain("btts");
        allMarkets.Should().Contain("spreads");
        allMarkets.Count.Should().Be(5); // Unique values only
    }
}
